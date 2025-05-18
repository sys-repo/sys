import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

const selectionAnimation: Required<t.LogoCanvasSelectionAnimation> = {
  loop: false,
  delay: 200,
};

const name = 'Logo.Canvas';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  selectionAnimation,
} as const;
export const D = DEFAULTS;
