import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Button } from '../Button/mod.ts';
export { Icons } from '../ui.Icons.ts';

/**
 * Constants:
 */
const name = 'Buttons.Icons';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
