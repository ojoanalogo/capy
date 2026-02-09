import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const INPUT_DIR = path.resolve(process.cwd(), "videos");
const OUTPUT_DIR = path.resolve(process.cwd(), "public", "videos");

function discoverVideos(): string[] {
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.error(`Created videos/ directory. Drop your raw videos there and re-run.`);
    process.exit(0);
  }

  return fs
    .readdirSync(INPUT_DIR)
    .filter((f) => /\.(mp4|mov|webm|mkv|avi|mts|m4v)$/i.test(f))
    .sort();
}

function processVideo(filename: string): void {
  const inputPath = path.resolve(INPUT_DIR, filename);
  const baseName = path.parse(filename).name;
  const outputPath = path.resolve(OUTPUT_DIR, `${baseName}.mp4`);

  if (fs.existsSync(outputPath)) {
    console.log(`  [skip] ${baseName}.mp4 already exists.`);
    return;
  }

  console.log(`  [ffmpeg] ${filename} → ${baseName}.mp4`);
  execSync(
    [
      "ffmpeg -y",
      `-i "${inputPath}"`,
      "-c:v libx264 -preset fast -crf 23",  // H.264 video
      "-c:a aac -b:a 128k",                  // AAC audio
      "-movflags +faststart",                 // Web-friendly streaming
      "-pix_fmt yuv420p",                     // Max browser compatibility
      `"${outputPath}"`,
    ].join(" "),
    { stdio: "pipe" },
  );
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const videos = discoverVideos();
  console.log(`=== Processing ${videos.length} video(s) ===`);
  console.log(`Input:  videos/`);
  console.log(`Output: public/videos/\n`);

  const filterArg = process.argv[2];
  const toProcess = filterArg
    ? videos.filter((v) => v === filterArg)
    : videos;

  if (filterArg && toProcess.length === 0) {
    console.error(`File "${filterArg}" not found in videos/`);
    process.exit(1);
  }

  for (const video of toProcess) {
    processVideo(video);
  }

  console.log("\n=== Done! Run `pnpm transcribe` next. ===");
}

main();
