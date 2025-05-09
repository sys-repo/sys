import { type t, DEFAULT, isRecord, Str } from './common.ts';
import { CssPseudoClass } from './m.CssPseudoClass.ts';

export const toString: t.StyleLib['toString'] = (style) => {
  if (!isRecord(style)) return '';
  return Object.entries(style)
    .filter(([prop]) => !CssPseudoClass.isClass(prop))
    .map(([prop, value]) => `${Str.camelToKebab(prop)}: ${formatValue(prop, value)};`)
    .join(' ');
};

/**
 * Helpers
 */
function formatValue(prop: string, value: unknown) {
  if (typeof value === 'string') return value.trim();
  const unit = DEFAULT.pixelProps.has(prop) ? 'px' : '';
  return `${value}${unit}`.trim();
}
