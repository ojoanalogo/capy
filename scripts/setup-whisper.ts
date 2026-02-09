import path from "path";
import {
  installWhisperCpp,
  downloadWhisperModel,
} from "@remotion/install-whisper-cpp";

const WHISPER_CPP_VERSION = "1.5.5";
const WHISPER_PATH = path.resolve(process.cwd(), "whisper.cpp");

async function main() {
  console.log("=== Setting up Whisper.cpp ===\n");

  console.log(`Installing Whisper.cpp v${WHISPER_CPP_VERSION} to ${WHISPER_PATH}...`);
  const { alreadyExisted: whisperExisted } = await installWhisperCpp({
    version: WHISPER_CPP_VERSION,
    to: WHISPER_PATH,
    printOutput: true,
  });

  if (whisperExisted) {
    console.log("Whisper.cpp already installed, skipping.\n");
  } else {
    console.log("Whisper.cpp installed successfully.\n");
  }

  console.log("Downloading medium model (~1.5GB)...");
  const { alreadyExisted: modelExisted } = await downloadWhisperModel({
    model: "medium",
    folder: WHISPER_PATH,
    printOutput: true,
    onProgress: (downloaded, total) => {
      const pct = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(`\rDownloading model: ${pct}%`);
    },
  });

  if (modelExisted) {
    console.log("\nModel already downloaded, skipping.");
  } else {
    console.log("\nModel downloaded successfully.");
  }

  console.log("\n=== Whisper setup complete! ===");
  console.log("Run `pnpm transcribe` to transcribe clips.");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
