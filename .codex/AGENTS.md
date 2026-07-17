# Project Instructions

## Overview

- This is a React 19 application written in TypeScript and bundled with Vite.
- The project uses `react-konva` and `konva` for canvas-based visuals.

## Development

- Keep changes focused and preserve the existing component structure.
- Use functional React components and hooks.
- Keep shared TypeScript types in `src/types.ts` when they are used across components.
- Keep reusable UI components in `src/components/` and utility logic in `src/utils/`.
- Use the existing CSS files for styling; avoid introducing a new styling dependency.
- Do not add inline comments unless they clarify non-obvious behavior.

## Validation

- Run `npm run build` after TypeScript, component, or configuration changes.
- Run `npm run lint` after JavaScript or TypeScript changes.
- Do not modify generated files in `dist/` manually.

## Conventions

- Prefer descriptive names over one-letter variables.
- Use existing formatting and naming patterns.
- Do not add dependencies unless the task requires them.
- Keep user-facing text accessible and clear.
