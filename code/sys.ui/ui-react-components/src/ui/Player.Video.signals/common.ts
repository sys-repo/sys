export * from '../common.ts';

export const DEFAULTS = {
  loop: false,
  showFullscreenButton: false,
  showVolumeControl: true,
  showControls: true,
  cornerRadius: 0,
  aspectRatio: '16/9',
  autoPlay: false,
  muted: false,
  background: false,
  scale: 1,
} as const;
export const D = DEFAULTS;
