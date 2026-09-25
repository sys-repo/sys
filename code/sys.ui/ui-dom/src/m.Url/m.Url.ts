import { type t, UrlBase } from './common.ts';
import { bindToWindow } from './u.bindToWindow.ts';

/** Browser URL helpers with window.location binding support. */
export const Url: t.DomUrl = {
  ...UrlBase,
  bindToWindow,
};
