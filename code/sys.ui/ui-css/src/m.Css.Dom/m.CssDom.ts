import type { CssDomLib } from './t.ts';

import { CssPseudoClass as PseudoClass } from './m.CssPseudoClass.ts';
import { create as stylesheet } from './u.stylesheet.ts';
import { toString } from './u.toString.ts';

export { toString };

export const CssDom: CssDomLib = {
  PseudoClass,
  stylesheet,
  toString,
};
