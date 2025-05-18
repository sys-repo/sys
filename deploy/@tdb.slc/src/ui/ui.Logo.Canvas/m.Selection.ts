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

  animation(value: P['selectionAnimation']): t.LogoCanvasSelectionAnimation | undefined {
    const DEFAULT = D.selectionAnimation;
    if (value === false) return undefined;
    if (value === true) return DEFAULT;
    return value ? { ...DEFAULT, ...value } : DEFAULT;
  },
} as const;
