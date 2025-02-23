export * from '../common.ts';

export { toHash };
import toHash from 'hash-it';

export * from '../common.ts';
export { CssTmpl } from '../m.Css.Tmpl/mod.ts';
export { toString } from '../m.Style/u.toString.ts';

export const DEFAULT = {
  prefix: 'sys',
  get pseudoClasses() {
    return pseudoClasses;
  },
} as const;

const pseudoClasses = new Set<string>([':hover']);
