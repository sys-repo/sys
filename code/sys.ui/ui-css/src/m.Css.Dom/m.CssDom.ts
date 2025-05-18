import type { t } from './common.ts';
import { CssPseudoClass as PseudoClass } from './m.CssPseudoClass.ts';
import { create as stylesheet } from './u.stylesheet.ts';
import { toString } from './u.toString.ts';

export { toString };

export const CssDom: t.CssDomLib = {
  PseudoClass,
  stylesheet,
  toString,
};
