use ffmpeg_sidecar::ffprobe::ffprobe_path;
use std::process::Command;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn process_video(path: &str) -> [std::string::String; 2] {
    let ffprobe_path = ffprobe_path();
    println!("Probing file {}", path);
    println!("ffprobe path {}", ffprobe_path.display());
    let output = Command::new(&ffprobe_path)
        .args([
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_chapters",
            "-show_format",
            "-show_streams",
            "-loglevel",
            "error",
            path,
        ])
        .output()
        .expect("Error probing");

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    println!("stdout: {}", stdout);
    println!("stderr: {}", stderr);
    // TODO: convert to mp3
    return [stdout, stderr];
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, process_video])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
