/**
 * @module
 * Tools for programatically managing CSS stylesheets within the browser DOM.
 */
import { type t } from './common.ts';
import { createStylesheet } from './u.create.ts';
import { toString } from './u.toString.ts';

export { toString };

export const CssDom: t.CssDomLib = {
  stylesheet: createStylesheet,
  toString,
};
