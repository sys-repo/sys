import type { t } from './common.ts';

/**
 * Number utility contracts.
 *
 * Members that correspond to `Number` or `Math` preserve the native base semantics. Stronger
 * operational contracts use self-describing names and state their refinement locally.
 */
export declare namespace Num {
  /**
   * Tools for working with numbers.
   */
  export type Lib = {
    /** ECMAScript-aligned predicates over number values. */
    readonly Is: Is.Lib;

    /** Num-owned percentage domain. */
    readonly Percent: t.Num.Percent.Lib;
    /** Num-owned aspect-ratio domain. */
    readonly Ratio: t.Num.Ratio.Lib;

    /**
     * Exact alias of `Number.MAX_SAFE_INTEGER`.
     * Upper bound for contracts that explicitly require safe integers.
     */
    readonly MAX_INT: number;

    /**
     * Exact alias of `Number.MIN_SAFE_INTEGER`.
     * Lower bound for contracts that explicitly require safe integers.
     */
    readonly MIN_INT: number;

    /** Exact alias of `Number.POSITIVE_INFINITY`. */
    readonly INFINITY: number;

    /** Distinct bounded and source-aware random number tools. */
    readonly random: Random.Fn;

    /**
     * Rounds to an optional decimal precision.
     * Omitted or zero precision corresponds to `Math.round`; non-zero precision is an extension.
     */
    round(value: number, precision?: number): number;

    /** Clamps a number between a minimum and maximum value. */
    clamp(min: number, max: number, value: number): number;

    /** Sum a list of numbers (empty list → 0). */
    sum(values: t.Ary<number>): number;

    /**
     * Convert a zero-based integer
     * (0 → A, 1 → B, ... 25 → Z, 26 → A again) into an ASCII uppercase letter.
     */
    toLetter: (index: number) => string;

    /**
     * Formats a number for display.
     * This is not `Number.prototype.toString` radix conversion or serialization.
     */
    toString(value?: number, maxDecimals?: number): string;
  };

  /**
   * Number predicate contracts.
   *
   * Native correspondence is preserved without redefining “integer” inside Num.
   */
  export namespace Is {
    /** Predicates over number values. */
    export type Lib = {
      /** Corresponds to `Number.isFinite`. */
      finite(input?: unknown): input is number;

      /** Corresponds to `Number.isInteger`. */
      int(input?: unknown): input is number;

      /**
       * Corresponds to `Number.isSafeInteger`.
       * Canonical for operations requiring safe integer arithmetic, bounds, counts, indexing, or
       * cardinality.
       */
      safeInt(input?: unknown): input is number;
    };
  }

  /**
   * Percentage contracts.
   */
  export namespace Percent {
    /**
     * Tools for working with numbers that represent percentages.
     */
    export type Lib = {
      /** Predicates over percentage-like values. */
      readonly Is: Is.Lib;
      /** Tools for working with percentage ranges. */
      readonly Range: Range.Lib;

      /**
       * Normalize a number or string to a bounded 0..1 percentage.
       * Numbers are fractional (`0.35` → 35%); strings may be fractional or percent-form (`"35%"`).
       * Invalid input normalizes to `0`; out-of-range values clamp to the nearest bound.
       */
      normalize(value?: string | number): t.Percent;

      /** Normalize a value, then constrain it by optional min/max percent bounds. */
      clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent;

      /** Convert a percentage to a "100%" string. */
      toString(value?: t.Percent): string;
    };

    /**
     * Percentage predicate contracts.
     */
    export namespace Is {
      /** Predicates over percentage-like values. */
      export type Lib = {
        /** Determine if the input represents a percentage (0..1). */
        percent(value?: unknown): value is t.Percent;

        /** Determine if the input represents pixels (> 1). */
        pixels(value?: unknown): value is t.Pixels;
      };
    }

    /**
     * Percentage range contracts.
     */
    export namespace Range {
      /**
       * Tools for working with percentage ranges (eg, min/max).
       */
      export type Lib = {
        /**
         * Convert a real value (eg brightness) → slider percent.
         * Valid ranges have exactly two finite endpoints with `min <= max`; invalid ranges return `0`.
         */
        toPercent(value: number, range: t.MinMaxNumberRange): t.Percent;

        /**
         * Convert a slider percent (0 … 1) → real value within the range.
         * Percent is clamped and output stays within a valid range; invalid ranges return `0`.
         */
        fromPercent(percent: number, range: t.MinMaxNumberRange): number;

        /** Determine whether input has exactly two finite endpoints with `min <= max`. */
        isRange(input?: unknown): input is t.MinMaxNumberRange;
      };
    }
  }

  /**
   * Aspect ratio contracts.
   */
  export namespace Ratio {
    /**
     * Tools for working with aspect ratios (pure math/formatting).
     * Kept generic so it can serve Media, CSS, image/layout, etc.
     */
    export type Lib = {
      /** Parse a positive finite ratio from string or number; invalid input returns `undefined`. */
      parse(value?: string | number): number | undefined;

      /**
       * Convert a positive finite ratio to its closest reduced fraction whose numerator and denominator
       * are positive safe integers and whose denominator does not exceed `maxDenominator`.
       * `maxDenominator` must be a positive safe integer. Ties select the lower denominator, then
       * numerator. Invalid input returns `undefined`.
       */
      toFraction(value?: number, maxDenominator?: number): { num: number; den: number } | undefined;

      /**
       * Format a positive finite ratio as `A/B`.
       * Invalid ratios return `"0/1"`; invalid bounds or a non-finite, negative, or unmet `maxError`
       * return a decimal `/1` fallback.
       */
      toString(
        value?: number,
        options?: { maxDenominator?: number; spaces?: boolean; maxError?: number },
      ): string;
    };
  }

  /**
   * Random number contracts.
   */
  export namespace Random {
    /** Random number generator with float and integer helpers. */
    export type Fn = {
      /**
       * Random float in [min, max).
       * Defaults:
       * - () => [0, 1)
       * - (max) => [0, max)
       * - (min, max) => [min, max)
       */
      (min?: number, max?: number, opts?: Options): number;

      /**
       * Random integer in [min, max] (inclusive).
       * Bounds must be ordered safe integers with exact cardinality no greater than
       * `Number.MAX_SAFE_INTEGER`.
       * A fixed range returns its endpoint without reading the source; `crypto` uses unbiased 53-bit
       * rejection sampling, while `math` and custom sources inherit their unit-source distribution.
       */
      int(min: number, max: number, opts?: Options): number;
    };

    /** Options for random number generation. */
    export type Options = {
      /**
       * Random source to use.
       * - 'math': `Math.random` (default)
       * - 'crypto': `crypto.getRandomValues`
       * - fn: custom source returning [0, 1)
       */
      readonly source?: Source;
    };

    /** Random source selector or custom RNG returning values in [0, 1). */
    export type Source = 'math' | 'crypto' | (() => number);
  }
}
