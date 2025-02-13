import { type t, DEFAULTS, isRecord, Str } from './common.ts';

export const toString: t.StyleLib['toString'] = (style) => {
  if (!isRecord(style)) return '';
  return Object.entries(style)
    .map(([prop, value]) => `${Str.camelToKebab(prop)}: ${formatValue(prop, value)};`)
    .join(' ');
};

/**
 * Helpers
 */
function formatValue(prop: string, value: unknown) {
  if (typeof value === 'string') return value;
  const unit = DEFAULTS.pixelProps.has(prop) ? 'px' : '';
  return `${value}${unit}`;
}
