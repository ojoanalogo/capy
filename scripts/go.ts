import { execSync } from "child_process";

const STEPS = [
  { cmd: "tsx scripts/process-videos.ts", label: "Procesando videos (ffmpeg)" },
  { cmd: "tsx scripts/transcribe.ts", label: "Transcribiendo audio (Whisper)" },
  {
    cmd: "tsx scripts/render-all.ts",
    label: "Renderizando videos con subtitulos",
  },
] as const;

function run(cmd: string): void {
  execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
}

function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║      CAPY  pipeline      ║");
  console.log("╚══════════════════════════════════════╝\n");

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i]!;
    console.log(`\n━━━ Paso ${i + 1}/${STEPS.length}: ${step.label} ━━━\n`);
    try {
      run(step.cmd);
    } catch {
      console.error(`\n✗ Fallo en paso ${i + 1}: ${step.label}`);
      console.error("  Revisa el error de arriba y vuelve a correr: pnpm go");
      process.exit(1);
    }
  }

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║       Listo! Videos en out/          ║");
  console.log("╚══════════════════════════════════════╝");
}

main();
