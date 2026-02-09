use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::ipc::Channel;

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Clone, Serialize, Deserialize)]
pub struct PipelineProgress {
    pub stage: String,
    pub percent: f64,
    pub message: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Caption {
    pub text: String,
    #[serde(rename = "startMs")]
    pub start_ms: f64,
    #[serde(rename = "endMs")]
    pub end_ms: f64,
    #[serde(rename = "timestampMs")]
    pub timestamp_ms: Option<f64>,
    pub confidence: f64,
}

fn project_root(_app: &tauri::AppHandle) -> PathBuf {
    // Walk up from the current directory until we find package.json
    let mut dir = std::env::current_dir().unwrap();
    loop {
        if dir.join("package.json").exists() && dir.join("remotion").exists() {
            return dir;
        }
        if !dir.pop() {
            break;
        }
    }
    // Fallback: assume we're in src-tauri/, go one up
    let cwd = std::env::current_dir().unwrap();
    if cwd.ends_with("src-tauri") {
        cwd.parent().unwrap().to_path_buf()
    } else {
        cwd
    }
}

/// Spawn a shell command with the user's full environment (PATH, etc).
fn shell_command(cmd: &str, root: &std::path::Path) -> Command {
    let mut c = Command::new("sh");
    c.arg("-lc")
        .arg(cmd)
        .current_dir(root)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    c
}

/// Read lines from a pipe, forward to progress channel, and collect for error reporting.
async fn read_pipe(
    pipe: impl tokio::io::AsyncRead + Unpin,
    on_event: &Channel<PipelineProgress>,
    stage: &str,
    collected: &mut Vec<String>,
) {
    let reader = BufReader::new(pipe);
    let mut lines = reader.lines();
    while let Ok(Some(line)) = lines.next_line().await {
        collected.push(line.clone());
        let _ = on_event.send(PipelineProgress {
            stage: stage.to_string(),
            percent: 50.0,
            message: line,
        });
    }
}

/// Collect output from a child process while forwarding to the progress channel.
async fn stream_output(
    child: &mut tokio::process::Child,
    on_event: &Channel<PipelineProgress>,
    stage: &str,
) -> Vec<String> {
    let mut lines_collected = Vec::new();

    if let Some(stdout) = child.stdout.take() {
        read_pipe(stdout, on_event, stage, &mut lines_collected).await;
    }
    if let Some(stderr) = child.stderr.take() {
        read_pipe(stderr, on_event, stage, &mut lines_collected).await;
    }

    lines_collected
}

/// Copy a dropped video file into the project's videos/ directory.
#[tauri::command]
pub async fn import_video(
    app: tauri::AppHandle,
    source_path: String,
) -> Result<String, String> {
    let root = project_root(&app);
    let videos_dir = root.join("videos");
    std::fs::create_dir_all(&videos_dir).map_err(|e| e.to_string())?;

    let src = PathBuf::from(&source_path);
    let raw_name = src
        .file_name()
        .ok_or("Invalid file path")?
        .to_string_lossy()
        .to_string();

    // Sanitize filename: replace spaces and special chars to avoid issues with whisper-cpp
    let stem = std::path::Path::new(&raw_name)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let ext = std::path::Path::new(&raw_name)
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let sanitized_stem: String = stem
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let filename = format!("{sanitized_stem}.{ext}");
    let dest = videos_dir.join(&filename);

    std::fs::copy(&src, &dest).map_err(|e| format!("Copy failed: {e}"))?;
    Ok(filename)
}

/// Run ffmpeg re-encode via the existing process-videos script.
#[tauri::command]
pub async fn process_video(
    app: tauri::AppHandle,
    input_file: String,
    on_event: Channel<PipelineProgress>,
) -> Result<String, String> {
    let root = project_root(&app);

    on_event
        .send(PipelineProgress {
            stage: "processing".into(),
            percent: 0.0,
            message: format!("Re-encoding {input_file}..."),
        })
        .map_err(|e| e.to_string())?;

    let cmd = format!("npx tsx scripts/process-videos.ts '{}'", input_file);
    let mut child = shell_command(&cmd, &root)
        .spawn()
        .map_err(|e| format!("Failed to start ffmpeg process: {e}"))?;

    let output = stream_output(&mut child, &on_event, "processing").await;

    let status = child.wait().await.map_err(|e| e.to_string())?;
    if !status.success() {
        let last_lines: String = output.iter().rev().take(5).rev().cloned().collect::<Vec<_>>().join("\n");
        return Err(format!("ffmpeg processing failed:\n{last_lines}"));
    }

    // Return the absolute path to the processed video in public/videos/
    let base_name = std::path::Path::new(&input_file)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let video_path = root.join("public/videos").join(format!("{base_name}.mp4"));

    on_event
        .send(PipelineProgress {
            stage: "processing".into(),
            percent: 100.0,
            message: "Video processing complete".into(),
        })
        .map_err(|e| e.to_string())?;

    Ok(video_path.to_string_lossy().to_string())
}

/// Run transcription via the existing transcribe.ts script.
#[tauri::command]
pub async fn transcribe_video(
    app: tauri::AppHandle,
    video_file: String,
    whisper_model: Option<String>,
    language: Option<String>,
    beam_size: Option<u32>,
    best_of: Option<u32>,
    max_len: Option<u32>,
    split_on_word: Option<bool>,
    on_event: Channel<PipelineProgress>,
) -> Result<String, String> {
    let root = project_root(&app);

    on_event
        .send(PipelineProgress {
            stage: "transcribing".into(),
            percent: 0.0,
            message: format!("Transcribing {video_file}..."),
        })
        .map_err(|e| e.to_string())?;

    // Build env vars for whisper settings
    let model = whisper_model.unwrap_or_else(|| "medium".to_string());
    let lang = language.unwrap_or_else(|| "es".to_string());
    let beam = beam_size.unwrap_or(5);
    let best = best_of.unwrap_or(5);
    let max_l = max_len.unwrap_or(40);
    let split = split_on_word.unwrap_or(true);

    let cmd = format!(
        "WHISPER_MODEL={} WHISPER_LANG={} WHISPER_BEAM_SIZE={} WHISPER_BEST_OF={} WHISPER_MAX_LEN={} WHISPER_SPLIT_ON_WORD={} npx tsx scripts/transcribe.ts '{}'",
        model, lang, beam, best, max_l, split, video_file
    );
    let mut child = shell_command(&cmd, &root)
        .spawn()
        .map_err(|e| format!("Failed to start transcription: {e}"))?;

    let output = stream_output(&mut child, &on_event, "transcribing").await;

    let status = child.wait().await.map_err(|e| e.to_string())?;
    if !status.success() {
        let last_lines: String = output.iter().rev().take(5).rev().cloned().collect::<Vec<_>>().join("\n");
        return Err(format!("Transcription failed:\n{last_lines}"));
    }

    let base_name = std::path::Path::new(&video_file)
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let caption_path = root
        .join("public/videos/captions")
        .join(format!("{base_name}.json"));

    on_event
        .send(PipelineProgress {
            stage: "transcribing".into(),
            percent: 100.0,
            message: "Transcription complete".into(),
        })
        .map_err(|e| e.to_string())?;

    Ok(caption_path.to_string_lossy().to_string())
}

/// Read captions from a JSON file.
#[tauri::command]
pub async fn read_captions(caption_path: String) -> Result<Vec<Caption>, String> {
    let data = std::fs::read_to_string(&caption_path)
        .map_err(|e| format!("Failed to read captions: {e}"))?;
    let captions: Vec<Caption> =
        serde_json::from_str(&data).map_err(|e| format!("Failed to parse captions: {e}"))?;
    Ok(captions)
}

/// Write edited captions back to JSON.
#[tauri::command]
pub async fn write_captions(
    caption_path: String,
    captions: Vec<Caption>,
) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&captions)
        .map_err(|e| format!("Failed to serialize captions: {e}"))?;
    std::fs::write(&caption_path, json)
        .map_err(|e| format!("Failed to write captions: {e}"))?;
    Ok(())
}

/// Render the final video via Remotion.
#[tauri::command]
pub async fn render_video(
    app: tauri::AppHandle,
    _video_file: String,
    props_json: String,
    output_path: String,
    on_event: Channel<PipelineProgress>,
) -> Result<String, String> {
    let root = project_root(&app);

    on_event
        .send(PipelineProgress {
            stage: "exporting".into(),
            percent: 0.0,
            message: "Starting render...".into(),
        })
        .map_err(|e| e.to_string())?;

    let cmd = format!(
        "npx remotion render CaptionedClip '{}' --props '{}'",
        output_path,
        props_json.replace('\'', "'\\''")
    );
    let mut child = shell_command(&cmd, &root)
        .spawn()
        .map_err(|e| format!("Failed to start render: {e}"))?;

    // Parse Remotion's frame progress from stderr
    if let Some(stderr) = child.stderr.take() {
        let on_event_clone = on_event.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let percent = parse_render_progress(&line).unwrap_or(-1.0);
                let _ = on_event_clone.send(PipelineProgress {
                    stage: "exporting".into(),
                    percent: if percent >= 0.0 { percent } else { -1.0 },
                    message: line,
                });
            }
        });
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;
    if !status.success() {
        return Err("Render failed".into());
    }

    on_event
        .send(PipelineProgress {
            stage: "exporting".into(),
            percent: 100.0,
            message: "Render complete!".into(),
        })
        .map_err(|e| e.to_string())?;

    Ok(output_path)
}

/// Trim a video using ffmpeg copy mode (fast, no re-encode).
#[tauri::command]
pub async fn trim_video(
    input_path: String,
    start_ms: f64,
    end_ms: f64,
    output_path: String,
) -> Result<String, String> {
    let start_s = start_ms / 1000.0;
    let duration_s = (end_ms - start_ms) / 1000.0;

    let status = Command::new("ffmpeg")
        .args([
            "-y",
            "-ss",
            &format!("{start_s:.3}"),
            "-i",
            &input_path,
            "-t",
            &format!("{duration_s:.3}"),
            "-c",
            "copy",
            "-avoid_negative_ts",
            "make_zero",
            &output_path,
        ])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start ffmpeg: {e}"))?
        .wait()
        .await
        .map_err(|e| format!("ffmpeg failed: {e}"))?;

    if !status.success() {
        return Err("ffmpeg trim failed".into());
    }

    Ok(output_path)
}

fn parse_render_progress(line: &str) -> Option<f64> {
    let re_pattern = regex_lite::Regex::new(r"(\d+)/(\d+)").ok()?;
    let caps = re_pattern.captures(line)?;
    let current: f64 = caps.get(1)?.as_str().parse().ok()?;
    let total: f64 = caps.get(2)?.as_str().parse().ok()?;
    if total > 0.0 {
        Some((current / total) * 100.0)
    } else {
        None
    }
}
