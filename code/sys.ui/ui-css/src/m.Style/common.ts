import toHash from 'hash-it';
export { toHash };

export * from '../common.ts';
export { Tmpl } from '../m.Tmpl/mod.ts';

export const DEFAULTS = {
  prefix: 'css',
  get pxProps() {
    return pxProps;
  },
} as const;

/**
 * CSS properties that accept unitless
 * numbers (equating to "px" pixels).
 */
const pxProps = new Set<string>([
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
