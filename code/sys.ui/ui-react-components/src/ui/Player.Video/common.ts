export * from '../common.ts';

export const DEFAULTS = {
  video: 'vimeo/499921561', // Tubes.

  loop: false,
  showFullscreenButton: false,
  showControls: true,
  cornerRadius: 10,
  aspectRatio: '16/9',
  autoPlay: false,
  muted: false,
} as const;
