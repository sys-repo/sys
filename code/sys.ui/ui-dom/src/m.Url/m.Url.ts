import { type t, UrlBase } from './common.ts';
import { bindToWindow } from './u.bindToWindow.ts';

export const Url: t.DomUrl = {
  ...UrlBase,
  bindToWindow,
};
