import { type t } from './common.ts';
import { Is as NumIs } from './m.Is.ts';

type Fraction = { num: number; den: number };

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const DEFAULT_MAX_DENOMINATOR = 32;

export const Ratio: t.Num.Ratio.Lib = Object.freeze({
  parse(value) {
    if (value == null) return undefined;
    if (typeof value === 'number') return isRatio(value) ? value : undefined;
    if (typeof value !== 'string') return undefined;

    const expr = value.replace(/\s+/g, '');
    if (/^\d+\/\d+$/.test(expr)) {
      const [numerator, denominator] = expr.split('/').map(Number);
      if (denominator === 0) return undefined;
      const ratio = numerator / denominator;
      return isRatio(ratio) ? ratio : undefined;
    }

    const ratio = Number(expr);
    return isRatio(ratio) ? ratio : undefined;
  },

  toFraction(value, maxDenominator = DEFAULT_MAX_DENOMINATOR) {
    if (!isRatio(value) || !isMaxDenominator(maxDenominator)) return undefined;
    return approximate(value, maxDenominator);
  },

  toString(value, options) {
    if (!isRatio(value)) return '0/1';

    const configuredMaxDenominator = options?.maxDenominator;
    const maxDenominator = configuredMaxDenominator === undefined
      ? DEFAULT_MAX_DENOMINATOR
      : configuredMaxDenominator;
    const maxError = options?.maxError;
    const separator = options?.spaces ? ' / ' : '/';
    const fraction = Ratio.toFraction(value, maxDenominator);

    if (fraction && acceptsError(value, fraction, maxError)) {
      return `${fraction.num}${separator}${fraction.den}`;
    }

    return `${decimalFallback(value)}${separator}1`;
  },
});

/**
 * Helpers:
 */
function isRatio(value: unknown): value is number {
  return NumIs.finite(value) && value > 0;
}

function isMaxDenominator(value: unknown): value is number {
  return NumIs.safeInt(value) && value > 0;
}

function isMaxError(value: unknown): value is number {
  return NumIs.finite(value) && value >= 0;
}

function approximate(value: number, maxDenominator: number): Fraction {
  if (value >= MAX_SAFE_INTEGER) return { num: MAX_SAFE_INTEGER, den: 1 };
  if (value <= 1 / maxDenominator) return { num: 1, den: maxDenominator };

  let previous: Fraction = { num: 0, den: 1 };
  let current: Fraction = { num: 1, den: 0 };
  let remainder = value;

  while (true) {
    const coefficient = Math.floor(remainder);
    const maxCoefficient = Math.min(
      maxScale(previous.num, current.num, MAX_SAFE_INTEGER),
      maxScale(previous.den, current.den, maxDenominator),
    );

    if (coefficient > maxCoefficient) {
      const boundary = addScaled(previous, current, maxCoefficient);
      return closest(value, boundary, current);
    }

    const next = addScaled(previous, current, coefficient);
    if (next.den > 0 && next.num / next.den === value) return next;
    [previous, current] = [current, next];

    const fraction = remainder - coefficient;
    if (fraction === 0) return current;
    remainder = 1 / fraction;
  }
}

function maxScale(base: number, step: number, maximum: number): number {
  return step === 0 ? Number.POSITIVE_INFINITY : Math.floor((maximum - base) / step);
}

function addScaled(base: Fraction, step: Fraction, scale: number): Fraction {
  return {
    num: base.num + scale * step.num,
    den: base.den + scale * step.den,
  };
}

function closest(value: number, first: Fraction, second: Fraction): Fraction {
  const firstError = Math.abs(value - first.num / first.den);
  const secondError = Math.abs(value - second.num / second.den);

  if (secondError < firstError) return second;
  if (secondError > firstError) return first;
  if (second.den < first.den) return second;
  if (second.den > first.den) return first;
  return second.num < first.num ? second : first;
}

function acceptsError(value: number, fraction: Fraction, maxError: unknown): boolean {
  if (maxError === undefined) return true;
  if (!isMaxError(maxError)) return false;
  return Math.abs(value - fraction.num / fraction.den) <= maxError;
}

function decimalFallback(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return NumIs.finite(rounded) && rounded > 0 ? String(rounded) : String(value);
}
