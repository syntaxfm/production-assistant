use chrono::Local;
use colored::*;
use ffmpeg_sidecar::{command::FfmpegCommand, event::FfmpegEvent};
use log::{error, info};
use regex::Regex;
use reqwest::Client;
use serde::Serialize;
use serde_json::json;
use serde_json::Value;
use std::path::Path;
use std::{fs::File, io::Read, path::PathBuf, process::Command, time::Duration};
use tauri::{Emitter, Manager};
use tauri_plugin_decorum::WebviewWindowExt;
use tauri_plugin_log::{Target, TargetKind};
use which::which;

fn ffprobe_path() -> Option<PathBuf> {
    // First, check if it's in the PATH
    if let Ok(path) = which("ffprobe") {
        return Some(path);
    }

    // Then, check common installation directories
    let common_paths = [
        "/usr/bin/ffprobe",
        "/usr/local/bin/ffprobe",
        "/opt/homebrew/bin/ffprobe",
        "C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe",
    ];

    for path in common_paths.iter() {
        let path = PathBuf::from(path);
        if path.exists() {
            return Some(path);
        }
    }

    // Finally, check for an environment variable
    if let Ok(path) = std::env::var("FFPROBE_PATH") {
        let path = PathBuf::from(path);
        if path.exists() {
            return Some(path);
        }
    }

    None
}

#[tauri::command]
fn get_video_path(path: String) -> String {
    let path = std::path::Path::new(&path);
    format!("file://{}", path.display())
}

#[tauri::command]
fn login_github(app_handle: tauri::AppHandle) {
    let window = app_handle
        .get_webview_window("login")
        .expect("Cannot get login window");
    window
        .eval("window.location.replace('https://github.com/login/oauth/authorize?client_id=Ov23licxOzkJuzZtsOZL&skip_accoun t_picker=false&scope=read:user repo')")
        .expect("Unable to redirect login.");
    window.show().expect("Unable to show window");
}

#[tauri::command]
fn login_youtube(app_handle: tauri::AppHandle) {
    let window = app_handle
        .get_webview_window("login")
        .expect("Cannot get login window");
    window
        .eval("window.location.replace('https://accounts.google.com/o/oauth2/v2/auth?client_id=464375532673-9mrbvgd110g1eh02im4qli2ooos43n59.apps.googleusercontent.com&redirect_uri=https://syntax.fm/some/not/found/path/auth/callback&scope=https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtubepartner&response_type=code&access_type=offline&prompt=consent select_account&include_granted_scopes=true')")
        .expect("Unable to redirect login.");
    window.show().expect("Unable to show window");
}

#[tauri::command]
fn hide_login_window(app_handle: tauri::AppHandle) {
    let window = app_handle
        .get_webview_window("login")
        .expect("Cannot get login window");
    window
        .eval("window.location.replace('/login')")
        .expect("Unable to redirect login.");
    window.hide().expect("Unable to hide window");
}

#[derive(Debug)]
pub enum MetadataError {
    CommandFailed(std::io::Error),
    OutputParseError(serde_json::Error),
    InvalidUtf8(std::string::FromUtf8Error),
}

#[derive(Debug, Serialize)]
struct MetadataResult {
    stdout: String,
    stderr: String,
}

#[tauri::command]
fn get_metadata(path: String) -> Result<MetadataResult, String> {
    let ffprobe_path = ffprobe_path().ok_or("ffprobe not found")?;
    info!("Probing file: {}", path);
    info!("ffprobe path: {:?}", ffprobe_path);

    let input_path = Path::new(&ffprobe_path);
    if input_path.exists() {
        info!("Input file exists");
    } else {
        error!("Input file does not exist");
    }

    let output = Command::new(ffprobe_path)
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
            &path,
        ])
        .output()
        .map_err(|e| {
            let error_msg = format!("Failed to execute ffprobe: {}", e);
            error!("{}", error_msg);
            error_msg
        })?;

    let stdout = String::from_utf8(output.stdout).map_err(|e| {
        let error_msg = format!("Failed to parse ffprobe output as UTF-8: {}", e);
        error!("{}", error_msg);
        error_msg
    })?;

    let stderr = String::from_utf8(output.stderr).map_err(|e| {
        let error_msg = format!("Failed to parse ffprobe error output as UTF-8: {}", e);
        error!("{}", error_msg);
        error_msg
    })?;

    Ok(MetadataResult { stdout, stderr })
}

fn get_duration(path: &str) -> Result<Duration, String> {
    let ffprobe_path = ffprobe_path().ok_or("ffprobe not found")?;
    let output = std::process::Command::new(ffprobe_path)
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

    let stream_id = input_path
        .file_stem()
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();

    let mut episode_id = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let regex = Regex::new(r"^(?<id>\d+)").unwrap();
    if let Some(caps) = regex.captures(stream_id.as_str()) {
        episode_id = (&caps["id"]).to_string();
    };
    let output_file = parent_dir.join(format!("Syntax_-_{}.mp3", episode_id));
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

#[tauri::command]
fn open_in_finder(path: &str) {
    Command::new("open").args(["-R", path]).spawn().unwrap();
}

#[tauri::command]
async fn upload_to_youtube(
    file_path: String,
    access_token: String,
    title: String,
    description: String,
    privacy_status: String,
    window: tauri::Window,
) -> Result<String, String> {
    println!("upload_to_youtube called with file_path: {}", file_path);

    let client = Client::new();

    // Initiate the upload
    let init_url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,contentDetails";
    let metadata = json!({
        "snippet": {
            "title": title,
            "description": description,
            "categoryId": "22"
        },
        "status": {
            "privacyStatus": privacy_status
        }
    });
    println!(
        "Request metadata: {}",
        serde_json::to_string_pretty(&metadata).unwrap()
    );

    let init_response = client
        .post(init_url)
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Content-Type", "application/json")
        .json(&metadata)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    println!("Response status: {:?}", init_response.status());
    println!("Response headers: {:?}", init_response.headers());

    let status = init_response.status();
    let headers = init_response.headers().clone();
    let body = init_response.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!(
            "Failed to initiate upload: Status: {:?}, Body: {}",
            status, body
        ));
    }

    let upload_url = headers
        .get("Location")
        .ok_or("No upload URL received")?
        .to_str()
        .map_err(|e| e.to_string())?
        .to_string();

    // Upload the file
    let mut file = File::open(file_path).map_err(|e| e.to_string())?;
    let file_size = file.metadata().map_err(|e| e.to_string())?.len();
    let chunk_size = 5 * 1024 * 1024; // 5MB chunks

    let mut buffer = vec![0; chunk_size as usize];
    let mut uploaded = 0;

    while uploaded < file_size {
        let bytes_read = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if bytes_read == 0 {
            break;
        }

        let chunk = &buffer[..bytes_read];
        let content_range = format!(
            "bytes {}-{}/{}",
            uploaded,
            uploaded + bytes_read as u64 - 1,
            file_size
        );

        let response = client
            .put(&upload_url)
            .header("Content-Range", content_range)
            .body(chunk.to_vec())
            .send()
            .await
            .map_err(|e| e.to_string())?;

        uploaded += bytes_read as u64;

        // Send progress update to frontend
        let progress = (uploaded as f64 / file_size as f64 * 100.0) as u32;
        window
            .emit("youtube_progress", progress)
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            return Ok(response.text().await.map_err(|e| e.to_string())?);
        }
    }

    Err("Upload failed".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(debug_assertions)]
    {
        let devtools = tauri_plugin_devtools::init();
        builder = builder.plugin(devtools);
    }

    #[cfg(not(debug_assertions))]
    {
        use tauri_plugin_log::{Builder, Target, TargetKind};
        builder = builder.plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .build(),
        )
    }

    builder
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_decorum::init()) // initialize the decorum plugin
        .setup(|app| {
            // Create a custom titlebar for main window
            // On macOS it needs hiddenTitle: true and titleBarStyle: overlay
            let window = app.get_webview_window("main").unwrap();
            let monitor = window.current_monitor().unwrap().unwrap();
            let size = monitor.size();
            window.create_overlay_titlebar().unwrap();

            #[cfg(target_os = "macos")]
            window.set_traffic_lights_inset(30.0, 20.0).unwrap();

            // Calculate 80% of the screen size
            let width = (size.width as f64 * 0.7) as u32;
            let height = (size.height as f64 * 1.0) as u32;

            // Set the window size
            window
                .set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
                    width, height,
                )))
                .unwrap();
            // Center the window
            let screen_position = monitor.position();
            let x = screen_position.x + ((size.width - width) / 2) as i32;
            let y = screen_position.y + ((size.height - height) / 2) as i32;
            window
                .set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(
                    x, y,
                )))
                .unwrap();

            Ok(())
        })
        .on_page_load(|window, _payload| {
            window.emit("login", _payload.url().to_string()).unwrap();
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_metadata,
            create_mp3,
            open_in_finder,
            get_video_path,
            login_github,
            hide_login_window,
            login_youtube,
            upload_to_youtube,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
