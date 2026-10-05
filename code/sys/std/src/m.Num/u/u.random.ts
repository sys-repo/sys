import { Is, type t } from '../common.ts';
import { Is as NumIs } from '../m.Is.ts';

const POW_2_53 = 9_007_199_254_740_992;
const POW_2_53_BIGINT = BigInt(POW_2_53);
const POW_2_26 = 67_108_864;
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

const randomFloat: t.Num.Random.Fn = ((
  min?: number,
  max?: number,
  options?: t.Num.Random.Options,
): number => {
  const [lo, hi] = normalizeFloatBounds(min, max);
  assertOrderedBounds(lo, hi);
  if (lo === hi) return lo;
  const unit = randomUnit(resolveSource(options));
  return lo + unit * (hi - lo);
}) as t.Num.Random.Fn;

randomFloat.int = (min, max, options): number => {
  assertFiniteNumber(min, 'min');
  assertFiniteNumber(max, 'max');
  assertInteger(min, 'min');
  assertInteger(max, 'max');
  assertSafeInteger(min, 'min');
  assertSafeInteger(max, 'max');
  assertOrderedBounds(min, max);
  if (min === max) return min;

  const cardinality = integerCardinality(min, max);
  const source = resolveSource(options);
  if (source === 'crypto') return randomIntegerFromCrypto(min, cardinality);

  return randomIntegerFromUnit(min, Number(cardinality), randomUnit(source));
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

function assertSafeInteger(value: number, name: string): void {
  if (!NumIs.safeInt(value)) {
    throwRangeError(`${name} must be a safe integer`);
  }
}

function integerCardinality(min: number, max: number): bigint {
  const cardinality = BigInt(max) - BigInt(min) + 1n;
  if (cardinality > MAX_SAFE_INTEGER_BIGINT) {
    throwRangeError('integer range size must not exceed Number.MAX_SAFE_INTEGER');
  }
  return cardinality;
}

function randomIntegerFromCrypto(min: number, cardinality: bigint): number {
  const limit = POW_2_53_BIGINT - (POW_2_53_BIGINT % cardinality);
  while (true) {
    const raw = BigInt(randomSafeIntFromCrypto());
    if (raw < limit) return min + Number(raw % cardinality);
  }
}

function randomIntegerFromUnit(min: number, cardinality: number, unit: number): number {
  const offset = Math.min(Math.floor(unit * cardinality), cardinality - 1);
  return min + offset;
}

const resolveSource = (options?: t.Num.Random.Options): t.Num.Random.Source => {
  return options?.source ?? 'math';
};

const randomUnitFromCrypto = (): number => randomSafeIntFromCrypto() / POW_2_53;

const randomSafeIntFromCrypto = (): number => {
  const parts = new Uint32Array(2);
  crypto.getRandomValues(parts);
  const high = parts[0] >>> 5;
  const low = parts[1] >>> 6;
  return high * POW_2_26 + low;
};

const randomUnit = (source: t.Num.Random.Source): number => {
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
