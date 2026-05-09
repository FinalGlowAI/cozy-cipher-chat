## Goal
Trigger a celebratory confetti burst whenever a user successfully encrypts or decrypts content in the app.

## Approach
Use the lightweight `canvas-confetti` library (small, dependency-free, well-supported) and fire a short burst on success paths.

## Where confetti will trigger
1. **Text Encryption** (`src/components/EncryptionPanel.tsx`) — on successful encrypt
2. **Text Decryption** (`src/components/EncryptionPanel.tsx`) — on successful decrypt
3. **Image Encryption** (`src/pages/ImageEncryption.tsx`) — on successful image encrypt
4. **Image Decryption** (`src/pages/ImageEncryption.tsx`) — on successful image decrypt

## Implementation steps
1. Add `canvas-confetti` dependency.
2. Create a small helper `src/lib/confetti.ts` exposing `celebrate()` — a tuned burst (medium particle count, themed colors pulled from CSS variables `--primary`, `--accent`) so it fits the design system. Includes a `prefers-reduced-motion` check to skip animation for accessibility.
3. Call `celebrate()` right after each success toast in the four flows above (only on success, never on errors or validation failures).

## Technical notes
- No backend / DB / RLS changes.
- No new UI components — purely an effect overlay rendered to a fullscreen canvas by the library.
- Respects reduced-motion users.
- Bundle impact: ~8 KB gzipped.
