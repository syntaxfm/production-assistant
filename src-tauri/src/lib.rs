use chrono::Local;
use colored::*;
use ffmpeg_sidecar::{command::FfmpegCommand, event::FfmpegEvent, ffprobe::ffprobe_path};
use regex::Regex;
use serde::Serialize;
use std::{path::PathBuf, process::Command, time::Duration};
use tauri::{Emitter, Manager};
use tauri_plugin_decorum::WebviewWindowExt;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_metadata(path: &str) -> [std::string::String; 2] {
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
    return [stdout, stderr];
}

fn get_duration(path: &str) -> Result<Duration, String> {
    let output = std::process::Command::new("ffprobe")
        .args(&[
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ])
        .output()
        .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

    let duration_str = String::from_utf8(output.stdout)
        .map_err(|e| format!("Failed to parse ffprobe output: {}", e))?;

    duration_str
        .trim()
        .parse::<f64>()
        .map(Duration::from_secs_f64)
        .map_err(|e| format!("Failed to parse duration: {}", e))
}

fn parse_time_to_seconds(time_str: &str) -> Option<f64> {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() != 3 {
        return None;
    }
    let hours: f64 = parts[0].parse().ok()?;
    let minutes: f64 = parts[1].parse().ok()?;
    let seconds: f64 = parts[2].parse().ok()?;
    Some(hours * 3600.0 + minutes * 60.0 + seconds)
}

#[derive(Serialize)]
struct Mp3Result {
    success: bool,
    message: String,
    output_path: Option<String>,
}

#[tauri::command(async)]
fn create_mp3(path: &str, app_handle: tauri::AppHandle) -> Result<Mp3Result, String> {
    println!("Creating MP3 {}", path);
    let input_path = PathBuf::from(path);
    let parent_dir = input_path
        .parent()
        .unwrap_or_else(|| std::path::Path::new("."));

    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let stream_id = input_path
        .file_stem()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();
    let output_file = parent_dir.join(format!("{}_{}.mp3", stream_id, timestamp));
    println!("Starting to write {}", output_file.to_str().unwrap());
    let total_duration = get_duration(path)?;
    let mut last_percent = 0;
    let progress_regex = Regex::new(r"time=(\d{2}:\d{2}:\d{2}\.\d{2})").unwrap();

    let mut command = FfmpegCommand::new();
    command
        .input(path)
        .output(output_file.to_str().unwrap())
        .args(&["-vn"])
        .args(&["-acodec", "libmp3lame"])
        .args(&["-q:a", "2"])
        .args(&["-map_metadata", "0"])
        .args(&["-id3v2_version", "3"])
        .arg("-progress")
        .arg("pipe:1") // This sends progress info to stdout
        .spawn()
        .map_err(|e| format!("Failed to spawn FFmpeg command: {}", e))?
        .iter()
        .map_err(|e| format!("Failed to iterate over FFmpeg events: {}", e))?
        .for_each(|event: FfmpegEvent| match event {
            FfmpegEvent::Log(level, msg) => {
                eprintln!("Received log event: [{:?}] {}", level, msg);

                if let Some(captures) = progress_regex.captures(&msg) {
                    if let Some(time_str) = captures.get(1) {
                        if let Some(current_time) = parse_time_to_seconds(time_str.as_str()) {
                            let percent =
                                (current_time / total_duration.as_secs_f64() * 100.0) as i32;
                            if percent > last_percent {
                                last_percent = percent;
                                app_handle.emit("mp3_progress", percent).unwrap();

                                eprintln!("Progress: {}%", percent);
                            }
                        }
                    }
                }
            }
            _ => {
                eprintln!("Received unexpected event: {:?}", event);
            }
        });
    println!(); // New line after progress bar

    if output_file.exists() {
        let output_path = output_file.to_str().map(|s| s.to_string());

        println!(
            "MP3 created successfully: {}",
            output_path.as_deref().unwrap_or("").green()
        );
        Ok(Mp3Result {
            success: true,
            message: "MP3 created successfully".to_string(),
            output_path,
        })
    } else {
        eprintln!("Error creating MP3 for stream_id: {}", stream_id.red());
        Ok(Mp3Result {
            success: false,
            message: format!("Failed to create MP3 for stream_id: {}", stream_id),
            output_path: None,
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_decorum::init()) // initialize the decorum plugin
        .setup(|app| {
            // Create a custom titlebar for main window
            // On Windows this hides decoration and creates custom window controls
            // On macOS it needs hiddenTitle: true and titleBarStyle: overlay
            let window = app.get_webview_window("main").unwrap();
            window.create_overlay_titlebar().unwrap();

            // Some macOS-specific helpers
            #[cfg(target_os = "macos")]
            {
                // Set a custom inset to the traffic lights
                window.set_traffic_lights_inset(12.0, 16.0).unwrap();

                // Make window transparent without privateApi
                window.make_transparent().unwrap();

                // Set window level
                // NSWindowLevel: https://developer.apple.com/documentation/appkit/nswindowlevel
                // window.set_window_level(25).unwrap();
            }

            let monitor = window.current_monitor().unwrap().unwrap();
            let size = monitor.size();

            // Calculate 80% of the screen size
            let width = (size.width as f64 * 0.7) as u32;
            let height = (size.height as f64 * 1.0) as u32;

            // Set the window size
            window
                .set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
                    width, height,
                )))
                .unwrap();

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, get_metadata, create_mp3])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
