/**
 * @module
 * VideoElement
 *
 * A focused wrapper around the native `<video>` element,
 * providing stable playback semantics and a clean control surface
 * for higher-level player orchestration.
 */
export { InfoPanel } from './-dev/mod.ts';
export { ElapsedTime } from './ui.Elapsed.tsx';
export { VideoElement } from './ui.tsx';

export { useFileSize } from './use.FileSize.ts';
export { usePlayerSignals } from './use.Signals.tsx';
