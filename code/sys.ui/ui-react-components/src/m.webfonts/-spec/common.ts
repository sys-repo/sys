import { pkg, Pkg } from '../../ui/-test.ui.ts';
export * from '../../ui/-test.ui.ts';
export type * as t from './-t.ts';
export { Fonts, useFontBundle } from '../mod.ts';
export { Button } from '../../ui/Button/mod.ts';

const name = 'fonts:webfonts';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
