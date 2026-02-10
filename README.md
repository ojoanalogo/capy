<div align="center">
  <img src=".github/capy.png" alt="Capy" width="328" />
  <p><strong>Auto-caption your videos locally, no cloud needed.</strong></p>
  <p>A desktop app that transcribes and captions your videos on-device using whisper.cpp, with a visual editor to style everything exactly how you want.</p>
</div>

---

![Editor view](.github/preview.jpeg)

## Features

- **On-device transcription** — powered by whisper.cpp, your videos never leave your machine
- **Style presets** — apply complete caption styles in one click, or customize text, background, effects, and animations individually
- **Visual timeline** — scrub, edit, and rearrange captions with a drag-and-drop timeline
- **Word emphasis** — highlight key words with custom styling
- **Page grouping** — control how captions are grouped and displayed
- **Glossary** — teach the transcriber domain-specific terms for better accuracy
- **Undo/redo** — full history support
- **Export** — render your captioned video when you're done

![Timeline view](.github/preview2.jpeg)

## Tech

Built with Tauri, React, Remotion, and whisper.cpp.

## Getting started

```bash
pnpm install
pnpm setup:whisper
pnpm tauri:dev
```

## License

[AGPL-3.0](./LICENSE)
