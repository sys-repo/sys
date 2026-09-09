import { type t, WebFont as Base } from './common.ts';
import { useWebFont } from './use.WebFont.ts';

/** Web-font helpers with React hook support. */
export const WebFont: t.WebFontLib = {
  ...Base,
  useWebFont,
};
