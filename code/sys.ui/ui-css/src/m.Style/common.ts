import toHash from 'hash-it';
import { DEFAULT as CssDomDefaults } from '../m.Css.Dom/common.ts';

export { CssDom, toString } from '../m.Css.Dom/mod.ts';
export { CssEdges } from '../m.Css.Edges/mod.ts';
export { CssTmpl } from '../m.Css.Tmpl/mod.ts';
export { toHash };

export * from '../common.ts';

export const DEFAULT = {
  get prefix() {
    return CssDomDefaults.classPrefix;
  },
  get pixelProps() {
    return CssDomDefaults.pixelProps;
  },
  get pseudoClasses() {
    return CssDomDefaults.pseudoClasses;
  },
} as const;
