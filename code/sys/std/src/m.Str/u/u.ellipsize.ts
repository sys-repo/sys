import { Is, type t } from '../common.ts';

type F = t.Str.Lib['ellipsize'];

export const ellipsize: F = (text = '', max, input = {}) => {
  const { ellipsis = '…' } = options(input);
  if (!text) return '';

  if (Is.array<number>(max)) {
    const left = clamp(max[0]);
    const right = clamp(max[1]);
    const budget = left + right + ellipsis.length;

    if (budget === 0) return '';
    if (text.length <= budget) return text;

    const head = left > 0 ? text.slice(0, left) : '';
    const tail = right > 0 ? text.slice(text.length - right) : '';
    return `${head}${ellipsis}${tail}`;
  }

  const total = clamp(max);
  if (total === 0) return '';
  if (text.length <= total) return text;
  if (ellipsis.length >= total) return ellipsis.slice(0, total);

  const remaining = total - ellipsis.length;
  const start = Math.ceil(remaining / 2);
  const end = Math.floor(remaining / 2);
  const head = text.slice(0, start);
  const tail = end > 0 ? text.slice(text.length - end) : '';
  return `${head}${ellipsis}${tail}`;
};

/**
 * Helpers:
 */
function clamp(input: unknown) {
  return Is.number(input) && Number.isFinite(input) && input > 0 ? Math.floor(input) : 0;
}

function options(input?: { ellipsis?: string } | string) {
  if (!input) return {};
  return Is.string(input) ? { ellipsis: input } : input;
}
