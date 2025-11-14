use std::process::Child;
use std::sync::Mutex;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use serde_json::Value;
use reqwest;

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
            let mut backend_path = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir")
                .join("bin");

            // Détection de l'OS pour choisir le binaire
            backend_path = backend_path.join(if cfg!(target_os = "windows") {
                "backend.exe"
            } else {
                "backend"
            });

            println!("Backend path: {:?}", backend_path);

            let mut child = std::process::Command::new(&backend_path)
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
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let child_mutex: tauri::State<Mutex<Child>> = window.state();
                if let Ok(mut child) = child_mutex.lock() {
                    let _ = child.kill();
                }
                api.prevent_close();
                window.close().unwrap();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}