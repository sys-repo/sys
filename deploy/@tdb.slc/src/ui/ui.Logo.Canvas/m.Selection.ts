import { type t, D } from './common.ts';

type P = t.LogoCanvasProps;

/**
 * Helpers for working with the component selection properties.
 */
export const Selection = {
  selected(value: P['selected']): t.CanvasPanel[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  },

  animation(value: P['selectionAnimation']): t.LogoCanvasSelectionAnimation {
    const DEFAULT = D.selectionAnimation;
    return value ? { ...DEFAULT, ...value } : DEFAULT;
  },
} as const;
