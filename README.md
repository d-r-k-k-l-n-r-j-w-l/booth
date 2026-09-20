# little booth ♡

A client-side, hand-drawn browser photobooth built with React, TypeScript, Vite, Drawably, Canvas, MediaDevices, CSS, and Zustand.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints. Camera access requires a secure context: `localhost` works during development, and deployed versions should use HTTPS.

## Included V1 flow

- Camera permission and multi-photo upload fallback
- 3- or 4-shot timed selfie session with flash
- Strip, three-shot, and 2×2 layouts
- Eight live and Canvas-exported filters
- Frame, sticker, text, undo, retake, and birthday-note interactions
- Client-only, high-resolution PNG export

Photos remain in browser memory only; nothing is uploaded.

## Where to extend it

- Add supplied Canva transparent overlay files to `public/frames/` and expand the `frames` manifest in `src/App.tsx`.
- Replace the initial character sticker palette with supplied assets, then draw those images inside `src/lib/renderBooth.ts`.
