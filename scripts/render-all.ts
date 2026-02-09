import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const VIDEOS_DIR = path.resolve(process.cwd(), "public", "videos");
const OUT_DIR = path.resolve(process.cwd(), "out");

function discoverVideos(): string[] {
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`Videos directory not found: ${VIDEOS_DIR}`);
    process.exit(1);
  }

  return fs
    .readdirSync(VIDEOS_DIR)
    .filter((f) => /\.(mp4|mov|webm|mkv)$/i.test(f))
    .sort();
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const videos = discoverVideos();
  console.log(`=== Rendering ${videos.length} video(s) ===\n`);

  // Allow filtering: pnpm render:captions -- somefile.mp4
  const filterArg = process.argv[2];
  const toProcess = filterArg
    ? videos.filter((v) => v === filterArg)
    : videos;

  if (filterArg && toProcess.length === 0) {
    console.error(`File "${filterArg}" not found in public/videos/`);
    process.exit(1);
  }

  for (const video of toProcess) {
    const baseName = path.parse(video).name;
    const outFile = path.resolve(OUT_DIR, `${baseName}-captioned.mp4`);
    const propsJson = JSON.stringify({ videoFile: video });

    console.log(`[${video}] → ${baseName}-captioned.mp4`);

    execSync(
      `npx remotion render CaptionedClip "${outFile}" --props '${propsJson}'`,
      { stdio: "inherit", cwd: process.cwd() },
    );

    console.log(`  Done.\n`);
  }

  console.log("=== All renders complete! ===");
}

main();
