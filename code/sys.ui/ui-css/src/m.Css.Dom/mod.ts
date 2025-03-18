/**
 * @module
 * Tools for programatically managing CSS stylesheets within the browser DOM.
 */
import { type t } from './common.ts';
import { createStylesheet } from './u.create.ts';

export const CssDom: t.CssDomLib = {
  createStylesheet,
};
