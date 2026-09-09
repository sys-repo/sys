import { isCData, isElement, isText } from '@std/xml';
import type { t } from './common.ts';

/** XML node type guards. */
export const Is: t.Xml.Is.Lib = Object.freeze({
  element: isElement,
  text: isText,
  cdata: isCData,
});
