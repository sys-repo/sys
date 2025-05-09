import { DEFAULT as CssDomDefaults } from '../m.Css.Dom/common.ts';

export { CssDom, toString } from '../m.Css.Dom/mod.ts';
export { CssEdges } from '../m.Css.Edges/mod.ts';
export { CssTmpl } from '../m.Css.Tmpl/mod.ts';

export * from '../common.ts';

export const DEFAULT = {
  get classPrefix() {
    return CssDomDefaults.classPrefix;
  },
  get pixelProps() {
    return CssDomDefaults.pixelProps;
  },
} as const;
