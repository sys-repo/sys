import { pkg, Pkg } from '../common.ts';

export { Crdt } from '@sys/driver-automerge/ui';
export { TextPanel } from '@sys/driver-prosemirror';

export * from '../common.ts';
export { CanvasLayout } from '../ui.Layout.Canvas/mod.ts';

/**
 * Constants:
 */
const name = 'Editor.Canvas';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
