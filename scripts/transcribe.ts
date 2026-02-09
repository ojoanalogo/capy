import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { transcribe } from "@remotion/install-whisper-cpp";
import type { Caption } from "@remotion/captions";

const WHISPER_CPP_VERSION = "1.5.5";
const WHISPER_PATH = path.resolve(process.cwd(), "whisper.cpp");
const VIDEOS_DIR = path.resolve(process.cwd(), "public", "videos");
const CAPTIONS_DIR = path.resolve(VIDEOS_DIR, "captions");

// Read settings from env vars (set by Tauri backend), with defaults
const WHISPER_MODEL = (process.env.WHISPER_MODEL || "medium") as
  | "tiny"
  | "base"
  | "small"
  | "medium"
  | "large";
const WHISPER_LANG = process.env.WHISPER_LANG || "es";
const WHISPER_BEAM_SIZE = parseInt(process.env.WHISPER_BEAM_SIZE || "5", 10);
const WHISPER_BEST_OF = parseInt(process.env.WHISPER_BEST_OF || "5", 10);
const WHISPER_MAX_LEN = parseInt(process.env.WHISPER_MAX_LEN || "40", 10);
const WHISPER_SPLIT_ON_WORD = process.env.WHISPER_SPLIT_ON_WORD !== "false";

function discoverVideos(): string[] {
  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error(`Videos directory not found: ${VIDEOS_DIR}`);
    console.error("Create it and drop your .mp4 files there.");
    process.exit(1);
  }

  return fs
    .readdirSync(VIDEOS_DIR)
    .filter((f) => /\.(mp4|mov|webm|mkv)$/i.test(f))
    .sort();
}

function extractAudio(videoPath: string, wavPath: string): void {
  console.log(`  Extracting audio → ${path.basename(wavPath)}`);
  // Pad 1s of silence at the end so Whisper doesn't drop the last word
  execSync(
    `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 -c:a pcm_s16le -af "apad=pad_dur=1" "${wavPath}"`,
    { stdio: "pipe" },
  );
}

/**
 * Merge sub-word tokens that Whisper split mid-word.
 * A caption that starts without a space (e.g. "e que") after a previous one
 * that was cut (e.g. "vist") gets merged back into a single caption.
 */
function mergeSubWordCaptions(captions: Caption[]): Caption[] {
  if (captions.length === 0) return captions;

  const merged: Caption[] = [];

  for (const cap of captions) {
    const prev = merged[merged.length - 1];

    // If this caption doesn't start with a space and follows the previous
    // one closely, it's a split sub-word — merge it back.
    // endMs is now derived from next token's DTW start, so this gap is reliable.
    if (prev && !cap.text.startsWith(" ") && cap.startMs - prev.endMs < 200) {
      prev.text += cap.text;
      prev.endMs = cap.endMs;
      // Keep the earlier timestampMs
    } else {
      merged.push({ ...cap });
    }
  }

  return merged;
}

/**
 * Detect common Whisper hallucinations — repeated filler or
 * boilerplate text that Whisper generates during silence.
 */
const HALLUCINATION_PATTERNS = [
  /\[.*\]/, // Whisper special tokens: [_BEG_], [SILENCIO], [MÚSICA], etc.
  /subtítulos/i,
  /gracias por ver/i,
  /suscríbete/i,
  /thanks for watching/i,
  /subscribe/i,
  /^\.*$/, // Just dots/periods
  /^[♪♫🎵🎶\s]+$/, // Just music symbols
  /^[-–—,.:;!?\s]+$/, // Just punctuation/dashes with no real words
];

function isHallucination(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  return HALLUCINATION_PATTERNS.some((p) => p.test(trimmed));
}

async function transcribeVideo(filename: string): Promise<void> {
  const videoPath = path.resolve(VIDEOS_DIR, filename);
  const baseName = path.parse(filename).name;
  const wavPath = path.resolve(CAPTIONS_DIR, `${baseName}.wav`);
  const outputPath = path.resolve(CAPTIONS_DIR, `${baseName}.json`);

  console.log(`\n[${filename}]`);

  /*   if (fs.existsSync(outputPath)) {
    console.log(
      "  Captions already exist, skipping. Delete the JSON to re-transcribe.",
    );
    return;
  }
 */
  extractAudio(videoPath, wavPath);

  console.log(
    `  Transcribing with Whisper (model: ${WHISPER_MODEL}, lang: ${WHISPER_LANG})...`,
  );
  const additionalArgs: string[] = [
    "--beam-size",
    String(WHISPER_BEAM_SIZE),
    "--best-of",
    String(WHISPER_BEST_OF),
    "--max-len",
    String(WHISPER_MAX_LEN),
  ];
  if (WHISPER_SPLIT_ON_WORD) {
    additionalArgs.push("--split-on-word");
  }

  const whisperResult = await transcribe({
    inputPath: wavPath,
    whisperPath: WHISPER_PATH,
    whisperCppVersion: WHISPER_CPP_VERSION,
    model: WHISPER_MODEL,
    tokenLevelTimestamps: true,
    language: WHISPER_LANG,
    printOutput: false,
    additionalArgs,
  });

  // Extract word-level captions from token data (toCaptions only gives sentence-level)
  // Collect all tokens first so we can estimate endMs from the next token's DTW start.
  // Also use segment.text as ground truth to recover truncated/garbled words.
  const allTokens: Array<{
    text: string;
    dtwMs: number | null;
    offsetFrom: number;
    offsetTo: number;
    confidence: number;
  }> = [];
  for (const segment of whisperResult.transcription) {
    const segStartIdx = allTokens.length;

    for (const token of segment.tokens) {
      const text = token.text;
      if (!text || !text.trim()) continue;
      // Skip Whisper special tokens like [_BEG_], [_TT_509], [SILENCIO], etc.
      if (/^\[.*\]$/.test(text.trim())) continue;
      const dtwMs = token.t_dtw === -1 ? null : token.t_dtw * 10;
      allTokens.push({
        text,
        dtwMs,
        offsetFrom: token.offsets.from,
        offsetTo: token.offsets.to,
        confidence: token.p,
      });
    }

    // Cross-check: use segment.text to recover words lost in token extraction.
    // Split segment text into words and compare with extracted tokens.
    const segText = (segment.text || "").trim();
    if (!segText) continue;

    const segWords = segText.split(/\s+/);
    const segTokens = allTokens.slice(segStartIdx);
    const tokensText = segTokens
      .map((t) => t.text)
      .join("")
      .trim();
    const tokenWords = tokensText.split(/\s+/);

    // Repair truncated words using segment text as ground truth.
    if (segTokens.length > 0) {
      // Case 1: Last token is a sub-word fragment (the word was split at segment boundary).
      // Use the last word from segment text to complete it.
      const lastTok = allTokens[allTokens.length - 1]!;
      const lastTokenText = lastTok.text;
      if (!lastTokenText.startsWith(" ") && segWords.length > 0) {
        // This token is a continuation piece — find the full word from segment text
        const lastSegWord = segWords[segWords.length - 1]!;
        // Find the token that started this word (has leading space)
        for (let j = allTokens.length - 1; j >= segStartIdx; j--) {
          if (allTokens[j]!.text.startsWith(" ")) {
            const partial = allTokens[j]!.text.trim();
            if (lastSegWord.toLowerCase().startsWith(partial.toLowerCase())) {
              allTokens[j]!.text = " " + lastSegWord;
              // Remove the continuation fragments
              allTokens.splice(j + 1, allTokens.length - j - 1);
            }
            break;
          }
        }
      }

      // Case 2: Segment text has more words than tokens produced
      // (e.g. "colección" → "cole" + garbled tokens that got filtered)
      const updatedSegTokens = allTokens.slice(segStartIdx);
      const updatedTokensText = updatedSegTokens
        .map((t) => t.text)
        .join("")
        .trim();
      const updatedTokenWords = updatedTokensText.split(/\s+/);
      if (
        segWords.length > updatedTokenWords.length &&
        updatedSegTokens.length > 0
      ) {
        const lastTokNow = allTokens[allTokens.length - 1]!;
        const lastTokenWord =
          updatedTokenWords[updatedTokenWords.length - 1] || "";
        const lastSegWord =
          segWords[updatedTokenWords.length - 1] || lastTokenWord;
        if (lastSegWord.toLowerCase().startsWith(lastTokenWord.toLowerCase())) {
          lastTokNow.text = " " + lastSegWord;
        }
        for (let w = updatedTokenWords.length; w < segWords.length; w++) {
          allTokens.push({
            text: " " + segWords[w]!,
            dtwMs:
              lastTokNow.dtwMs !== null
                ? lastTokNow.dtwMs + (w - updatedTokenWords.length + 1) * 100
                : null,
            offsetFrom: lastTokNow.offsetTo,
            offsetTo: lastTokNow.offsetTo + 150,
            confidence: lastTokNow.confidence,
          });
        }
      }
    }
  }

  // Build captions with consistent timestamps:
  // - startMs: DTW timestamp (precise) when available, else offset
  // - endMs: next token's DTW start when available, else startMs + 150ms fallback
  const rawCaptions: Caption[] = allTokens.map((tok, i) => {
    const startMs = tok.dtwMs ?? tok.offsetFrom;
    const next = allTokens[i + 1];
    const nextStart = next ? (next.dtwMs ?? next.offsetFrom) : null;
    // Use next token's start as our end, or fallback to start + 150ms.
    // Cap at 1s so captions don't linger through long silence gaps.
    const MAX_WORD_DURATION_MS = 1000;
    const rawEnd = nextStart !== null ? nextStart : startMs + 150;
    const endMs = Math.min(
      Math.max(rawEnd, startMs + 1),
      startMs + MAX_WORD_DURATION_MS,
    );

    return {
      text: tok.text,
      startMs,
      endMs,
      timestampMs: tok.dtwMs,
      confidence: tok.confidence,
    };
  });

  // Post-process pipeline
  const captions = mergeSubWordCaptions(rawCaptions)
    // Strip common Whisper artifacts from text (dashes, stray punctuation)
    .map((c) => ({
      ...c,
      text: c.text.replace(/[-–—]+/g, "").replace(/\s{2,}/g, " "),
    }))
    .filter((c) => c.text.trim().length > 0)
    // Drop orphaned sub-word fragments (no leading space = wasn't a standalone word)
    .filter((c) => c.text.startsWith(" ") || c.text.trim().length >= 3)
    .filter((c) => !isHallucination(c.text));

  fs.writeFileSync(outputPath, JSON.stringify(captions, null, 2));
  console.log(
    `  Wrote ${captions.length} captions → captions/${baseName}.json`,
  );

  // Clean up temp WAV (may not exist if whisper-cpp already cleaned it)
  if (fs.existsSync(wavPath)) {
    fs.unlinkSync(wavPath);
  }
}

async function main() {
  fs.mkdirSync(CAPTIONS_DIR, { recursive: true });

  const videos = discoverVideos();
  console.log("=== Transcription Pipeline ===");
  console.log(`Found ${videos.length} video(s) in public/videos/`);

  // Allow filtering: pnpm transcribe -- somefile.mp4
  const filterArg = process.argv[2];
  const toProcess = filterArg ? videos.filter((v) => v === filterArg) : videos;

  if (filterArg && toProcess.length === 0) {
    console.error(`File "${filterArg}" not found in public/videos/`);
    process.exit(1);
  }

  for (const video of toProcess) {
    await transcribeVideo(video);
  }

  console.log("\n=== Done! ===");
}

main().catch((err) => {
  console.error("Transcription failed:", err);
  process.exit(1);
});
