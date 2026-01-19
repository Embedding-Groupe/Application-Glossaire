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

#[tauri::command]
fn check_ollama() -> bool {
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