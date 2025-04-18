import type { t } from '../common.ts';
export * from '../common.ts';

const selectionAnimation: Required<t.LogoCanvasSelectionAnimation> = {
  loop: false,
  delay: 200,
};

export const DEFAULTS = {
  selectionAnimation,
} as const;
export const D = DEFAULTS;
