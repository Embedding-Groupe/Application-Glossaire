use std::process::Child;
use std::sync::Mutex;
use tauri::{WindowEvent, Manager, State, AppHandle};
use std::fs;
use reqwest;
use std::process::Command;
use serde_json::Value;
use std::process::Stdio;
use std::path::Path;
use tauri::path::BaseDirectory;

// State to manage the backend process
struct BackendState {
    child: Mutex<Option<Child>>,
}

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
    Command::new(&ollama_path)
        .arg("--version")
        .output()
        .is_ok()
}

#[tauri::command]
async fn install_ollama() -> Result<(), String> {
    println!("Installing Ollama...");

    #[cfg(target_os = "macos")]
    {
        let url = "https://ollama.com/download/Ollama-darwin.zip";
        let zip_path = "/tmp/ollama.zip";

        let bytes = reqwest::get(url).await.map_err(|e| e.to_string())?.bytes().await.map_err(|e| e.to_string())?;
        fs::write(zip_path, &bytes).map_err(|e| e.to_string())?;

        Command::new("unzip")
            .arg(zip_path)
            .arg("-d")
            .arg("/Applications")
            .status()
            .map_err(|e| e.to_string())?;

        println!("Launching Ollama.app");
        Command::new("open")
            .arg("/Applications/Ollama.app")
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        let tmp = std::env::temp_dir().join("OllamaSetup.exe");
        let url = "https://ollama.com/download/OllamaSetup.exe";

        let bytes = reqwest::get(url).await.map_err(|e| e.to_string())?.bytes().await.map_err(|e| e.to_string())?;
        fs::write(&tmp, &bytes).map_err(|e| e.to_string())?;

        println!("Launching installer");
        // Use powershell to start process and wait? Or just spawn.
        // Spawning is better to let the user interact with the installer UI.
        // We'll wait in the loop below for it to finish installing (check_ollama).
        Command::new(&tmp)
            .spawn()
            .map_err(|e| format!("Failed to launch installer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try to open a terminal to run the install script, as it might ask for sudo
        // This is tricky on Linux. A generic way is hard.
        // Let's try x-terminal-emulator or similar.
        
        let install_cmd = "curl -fsSL https://ollama.com/install.sh | sh";
        
        // Strategy: try standard terminals.
        let terminals = ["gnome-terminal", "konsole", "xterm", "lxterminal", "mate-terminal"];
        let mut started = false;

        for t in terminals {
             let args = match t {
                "gnome-terminal" | "lxterminal" | "mate-terminal" => vec!["--", "sh", "-c", install_cmd],
                "konsole" => vec!["-e", "sh", "-c", install_cmd],
                "xterm" => vec!["-e", install_cmd],
                _ => vec![],
            };
            
            if !args.is_empty() {
                if Command::new(t).args(args).spawn().is_ok() {
                    started = true;
                    break;
                }
            }
        }

        if !started {
             return Err("Could not find a supported terminal to run installation (tried gnome-terminal, konsole, xterm, etc.). Please install Ollama manually from ollama.com".to_string());
        }
    }
    
    // Polling until installed
    let ollama_path = find_ollama_path();
    for _ in 0..120 { // Wait up to 2 minutes
        if Command::new(&ollama_path).arg("--version").output().is_ok() {
            println!("Ollama detected!");
            return Ok(());
        }
        std::thread::sleep(std::time::Duration::from_secs(1)); 
    }

    Err("Ollama installation timeout or failed. Please check if it installed correctly.".to_string())
}

#[tauri::command]
fn start_backend(app: AppHandle, state: State<'_, BackendState>) -> Result<(), String> {
    let mut child_guard = state.child.lock().unwrap();
    
    if child_guard.is_some() {
        println!("Backend already running");
        return Ok(());
    }

    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    
    // Le backend.exe est dans resource_dir/bin/
    let backend_path = resource_dir
        .join("bin")
        .join(if cfg!(target_os = "windows") {
            "backend.exe"
        } else {
            "backend"
        });

    println!("Starting Backend at: {:?}", backend_path);

    let child = Command::new(&backend_path)
        .current_dir(resource_dir.join("bin"))
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Failed to start backend: {}", e))?;

    *child_guard = Some(child);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(BackendState { child: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![greet, proxy_request, check_ollama, install_ollama, start_backend])
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<BackendState>();
                if let Ok(mut child_guard) = state.child.lock() {
                    if let Some(mut child) = child_guard.take() {
                        println!("Killing backend process...");
                        #[cfg(unix)]
                        {
                            let _ = Command::new("kill")
                                .arg("-15")
                                .arg(child.id().to_string())
                                .status();
                        }

                        #[cfg(windows)]
                        {
                            let _ = child.kill();
                        }
                    }
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
        // Local user install
        &format!(r"{}\AppData\Local\Programs\Ollama\ollama.exe", std::env::var("USERPROFILE").unwrap_or_default()),
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