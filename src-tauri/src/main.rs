// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ffmpeg_sidecar::download::auto_download().unwrap();
    syntax_production_assistant_lib::run()
}
