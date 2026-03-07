import { Is, type t } from './common.ts';

const POW_2_53 = 9_007_199_254_740_992;
const POW_2_26 = 67_108_864;
const U32_MAX_PLUS_ONE = 4_294_967_296;

const randomFloat: t.NumRandom = ((
  min?: number,
  max?: number,
  options?: t.NumRandomOptions,
): number => {
  const [lo, hi] = normalizeFloatBounds(min, max);
  assertOrderedBounds(lo, hi);
  if (lo === hi) return lo;
  const unit = randomUnit(resolveSource(options));
  return lo + unit * (hi - lo);
}) as t.NumRandom;

randomFloat.int = (min, max, options): number => {
  assertFiniteNumber(min, 'min');
  assertFiniteNumber(max, 'max');
  assertInteger(min, 'min');
  assertInteger(max, 'max');
  assertOrderedBounds(min, max);
  if (min === max) return min;

  const source = resolveSource(options);
  const span = max - min + 1;
  if (span <= 0) throwRangeError('integer range size overflow');

  if (source === 'crypto' && span <= U32_MAX_PLUS_ONE) {
    const limit = Math.floor(U32_MAX_PLUS_ONE / span) * span;
    const values = new Uint32Array(1);
    while (true) {
      crypto.getRandomValues(values);
      const raw = values[0];
      if (raw < limit) return min + (raw % span);
    }
  }

  const unit = randomUnit(source);
  return min + Math.floor(unit * span);
};

/**
 * Export callable with sub-methods.
 */
export const random = randomFloat;

/**
 * Helpers:
 */
function throwRangeError(message: string): never {
  throw new RangeError(message);
}

function assertFiniteNumber(value: unknown, name: string): asserts value is number {
  if (!Is.number(value) || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${name} must be an integer`);
  }
}

const resolveSource = (options?: t.NumRandomOptions): t.NumRandomSource => {
  return options?.source ?? 'math';
};

const randomUnitFromCrypto = (): number => {
  const parts = new Uint32Array(2);
  crypto.getRandomValues(parts);
  const high = parts[0] >>> 5;
  const low = parts[1] >>> 6;
  return (high * POW_2_26 + low) / POW_2_53;
};

const randomUnit = (source: t.NumRandomSource): number => {
  if (source === 'math') return Math.random();
  if (source === 'crypto') return randomUnitFromCrypto();
  const value = source();
  assertFiniteNumber(value, 'random source result');
  if (value < 0 || value >= 1) {
    throwRangeError('random source result must be in [0, 1)');
  }
  return value;
};

const normalizeFloatBounds = (min?: number, max?: number): readonly [number, number] => {
  if (min === undefined && max === undefined) return [0, 1] as const;
  if (max === undefined) {
    assertFiniteNumber(min, 'max');
    return [0, min];
  }

  assertFiniteNumber(min, 'min');
  assertFiniteNumber(max, 'max');
  return [min, max];
};

const assertOrderedBounds = (min: number, max: number): void => {
  if (min > max) {
    throwRangeError('min must be less than or equal to max');
  }
};
