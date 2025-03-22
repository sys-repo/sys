/**
 * @module
 * Tools for programatically managing CSS stylesheets within the browser DOM.
 */
import { type t } from './common.ts';
import { create as stylesheet } from './u.stylesheet.ts';
import { toString } from './u.toString.ts';

export { toString };

export const CssDom: t.CssDomLib = {
  stylesheet,
  toString,
};
