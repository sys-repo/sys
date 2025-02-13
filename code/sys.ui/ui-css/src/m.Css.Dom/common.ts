export * from '../common.ts';

export { toHash };
import toHash from 'hash-it';

export * from '../common.ts';
export { CssTmpl } from '../m.Css.Tmpl/mod.ts';
export { toString } from '../m.Style/u.toString.ts';

export const DEFAULTS = {
  prefix: 'css',
  get pixelProps() {
    return pixelProps;
  },
} as const;

/**
 * CSS properties that accept unitless
 * numbers (equating to "px" pixels).
 */
const pixelProps = new Set<string>([
  'width',
  'height',
  'top',
  'right',
  'bottom',
  'left',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRadius',
  'fontSize',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'outlineWidth',
  'letterSpacing',
  'wordSpacing',
]);
