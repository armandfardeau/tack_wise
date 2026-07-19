# Tack Wise

Tack Wise is a browser-based Tactical Sailing Situations (TSS) authoring and presentation tool. It is designed for coaches, sailors, umpires, and protest committees who need to draw, animate, explain, and share sailing situations.

## Features

- Wind direction, speed, sail trim, and boat headings.
- Boats, marks, gates, obstructions, connections, and rounding arrows.
- Curved tactical arrows, comments, uploaded diagram images, and rule references.
- Step-by-step or continuous animation with single-frame or cumulative display.
- Timeline editing with add, duplicate, rename, delete, playback, and speed control.
- Canvas pan, zoom, placement grid, magnetic snapping, presenter mode, and print output.
- Undo/redo, autosave recovery, local scenario library, JSON import/export, and portable share links.
- PNG/JPG diagram export, animated GIF export, and WEBM or MP4 video export.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run lint
npm run build
```

The current scenario JSON format supports version 1 imports and version 2 exports when presentation settings are included.
