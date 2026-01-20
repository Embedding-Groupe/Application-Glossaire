use std::process::Child;
use std::sync::Mutex;
use tauri::{WindowEvent, Manager};
use std::fs;
use reqwest;
use std::process::Command;
use serde_json::Value;
use std::process::Stdio;
use std::path::Path;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}


#[tauri::command]
fn proxy_request(method: String, url: String, body: Option<Value>) -> Result<Value, String> {
    let client = reqwest::blocking::Client::new();
    let method_upper = method.to_uppercase();
    let mut req = match method_upper.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        other => return Err(format!("Unsupported method: {}", other)),
    };

    if let Some(b) = body {
        req = req.json(&b);
    }

    let res = req.send().map_err(|e| format!("request error: {}", e))?;
    let text = res.text().map_err(|e| format!("read body error: {}", e))?;

    match serde_json::from_str::<Value>(&text) {
        Ok(val) => Ok(val),
        Err(_) => Ok(Value::String(text)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, proxy_request])
        .setup(|app| {
            let resource_dir = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir");

            // Check if Ollama is installed
            let ollama_path = find_ollama_path();
            let has_ollama = Command::new(&ollama_path)
                .arg("--version")
                .output()
                .is_ok();

            if !has_ollama {
                // Show native OS dialog asking to install Ollama
                let confirmed = show_ollama_dialog();
                
                if confirmed {
                    if let Err(e) = install_ollama_if_needed() {
                        println!("Failed to install Ollama: {:?}", e);
                    }
                }
            } else {
                println!("Ollama already installed");
            }

            // Le backend est dans resource_dir/bin/ (préfère backend-new.* si présent)
            let bin_dir = resource_dir.join("bin");
            let candidates: [&str; 2] = if cfg!(target_os = "windows") {
                ["backend-new.exe", "backend.exe"]
            } else {
                ["backend-new", "backend"]
            };

            let backend_path = candidates
                .iter()
                .map(|name| bin_dir.join(name))
                .find(|p| p.exists())
                .unwrap_or_else(|| bin_dir.join(candidates[1]));

            println!("Backend path: {:?}", backend_path);

            let child = std::process::Command::new(&backend_path)
                .current_dir(resource_dir.join("bin"))
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit())
                .spawn()
                .expect("Failed to start backend");

            // Stocker dans un Mutex pour le rendre accessible à la fermeture
            app.manage(Mutex::new(child));

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                let child_mutex = window.state::<Mutex<Child>>();
                if let Ok(mut child) = child_mutex.lock() {
                     #[cfg(unix)]
                    {
                        let _ = std::process::Command::new("kill")
                            .arg("-15")
                            .arg(child.id().to_string())
                            .status();
                    }

                    #[cfg(windows)]
                    {
                        let _ = child.kill();
                    }
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


fn show_ollama_dialog() -> bool {
    #[cfg(target_os = "macos")]
    {
        // Use osascript to show a dialog on macOS
        let output = Command::new("osascript")
            .arg("-e")
            .arg("tell app \"System Events\" to button returned of (display dialog \"Do you want to install Ollama? It's needed for AI suggestions\" buttons {\"Yes\", \"No\"} default button 1 with icon caution)")
            .output();

        match output {
            Ok(out) => {
                let result = String::from_utf8_lossy(&out.stdout);
                result.contains("Yes")
            }
            Err(_) => false,
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to show a dialog on Windows
        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg("[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; [System.Windows.Forms.MessageBox]::Show('Do you want to install Ollama? It\\'s needed for AI suggestions', 'Install Ollama', [System.Windows.Forms.MessageBoxButtons]::YesNo) -eq [System.Windows.Forms.DialogResult]::Yes")
            .output();

        match output {
            Ok(out) => {
                let result = String::from_utf8_lossy(&out.stdout);
                result.trim() == "True"
            }
            Err(_) => false,
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Try zenity first, then kdialog as fallback
        let zenity_result = Command::new("zenity")
            .arg("--question")
            .arg("--text=Do you want to install Ollama? It's needed for AI suggestions")
            .arg("--title=Install Ollama")
            .status();

        match zenity_result {
            Ok(status) => status.success(),
            Err(_) => {
                // Fallback to kdialog
                let kdialog_result = Command::new("kdialog")
                    .arg("--yesno")
                    .arg("Do you want to install Ollama? It's needed for AI suggestions")
                    .arg("--title")
                    .arg("Install Ollama")
                    .status();

                match kdialog_result {
                    Ok(status) => status.success(),
                    Err(_) => false,
                }
            }
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        false
    }
}


fn install_ollama_if_needed() -> anyhow::Result<()> {
    let ollama_path = find_ollama_path();
    // 1. detect if ollama exists
    let has_ollama = Command::new(&ollama_path)
        .arg("--version")
        .output()
        .is_ok();

    if has_ollama {
        println!("Ollama already installed");
        return Ok(());
    }

    println!("Ollama NOT installed → downloading installer");

    #[cfg(target_os = "macos")]
    {
        let url = "https://ollama.com/download/Ollama-darwin.zip";
        let zip_path = "/tmp/ollama.zip";

        let bytes = reqwest::blocking::get(url)?.bytes()?;
        fs::write(zip_path, &bytes)?;

        Command::new("unzip")
            .arg(zip_path)
            .arg("-d")
            .arg("/Applications")
            .status()?;

        println!("Launching Ollama.app");
        Command::new("open")
            .arg("/Applications/Ollama.app")
            .spawn()?;
    }

    #[cfg(target_os = "windows")]
    {
        let tmp = std::env::temp_dir().join("OllamaSetup.exe");
        let url = "https://ollama.com/download/OllamaSetup.exe";

        let bytes = reqwest::blocking::get(url)?.bytes()?;
        fs::write(&tmp, &bytes)?;

        println!("Launching installer");
        Command::new(&tmp).spawn()?;
    }

    #[cfg(target_os = "linux")]
    {
        // Run the official installer script
        let status = Command::new("sh")
            .arg("-c")
            .arg("curl -fsSL https://ollama.com/install.sh | sh")
            .status()?;

        if !status.success() {
            anyhow::bail!("Ollama Linux installer failed.");
        }
    }

    // 4. Wait until ollama is ready
    for _ in 0..20 {
        if Command::new(&ollama_path).arg("--version").output().is_ok() {
            println!("Ollama ready!");
            return Ok(());
        }
        std::thread::sleep(std::time::Duration::from_secs(1));
    }

    anyhow::bail!("Ollama did not start");
}


fn find_ollama_path() -> String {
    // Définir les chemins possibles selon l'OS
    #[cfg(target_os = "macos")]
    let candidates = [
        "/usr/local/bin/ollama",      // classique
        "/opt/homebrew/bin/ollama",   // homebrew sur Apple Silicon
        "/usr/bin/ollama",            // fallback mac
    ];

    #[cfg(target_os = "linux")]
    let candidates = [
        "/usr/local/bin/ollama",
        "/usr/bin/ollama",
        "/snap/bin/ollama",           // si installé via snap
    ];

    #[cfg(target_os = "windows")]
    let candidates = [
        r"C:\Program Files\Ollama\ollama.exe",
        r"C:\Program Files (x86)\Ollama\ollama.exe",
    ];

    // Chercher dans les chemins candidats
    for c in &candidates {
        if Path::new(c).exists() {
            return c.to_string();
        }
    }

    // Fallback : chercher dans le PATH
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let exe_name = if cfg!(target_os = "windows") {
                "ollama.exe"
            } else {
                "ollama"
            };
            let candidate = dir.join(exe_name);
            if candidate.exists() {
                return candidate.to_string_lossy().to_string();
            }
        }
    }

    // Fallback final : juste "ollama" pour que le système essaie
    if cfg!(target_os = "windows") {
        "ollama.exe".to_string()
    } else {
        "ollama".to_string()
    }
}