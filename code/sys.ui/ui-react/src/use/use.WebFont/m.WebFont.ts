import { type t, WebFont as Base } from './common.ts';
import { useWebFont } from './use.WebFont.ts';

export const WebFont: t.WebFontLib = {
  ...Base,
  useWebFont,
};
