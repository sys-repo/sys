import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';

const name = 'CircularSpinner';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
