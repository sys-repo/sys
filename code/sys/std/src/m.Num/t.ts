import type { t } from './common.ts';

/**
 * Number utility contracts.
 */
export declare namespace Num {
  /**
   * Tools for working with numbers.
   */
  export type Lib = {
    /** Predicates over number values. */
    readonly Is: Is.Lib;

    /** Tools for working with percentages. */
    readonly Percent: t.Num.Percent.Lib;
    /** Tools for working with ratios. */
    readonly Ratio: t.Num.Ratio.Lib;

    /**
     * Maximum integer representable exactly in the Num domain.
     * Alias of Number.MAX_SAFE_INTEGER (IEEE-754 safe integer limit).
     */
    readonly MAX_INT: number;

    /**
     * Minimum integer representable exactly in the Num domain.
     * Equivalent to -Number.MAX_SAFE_INTEGER.
     */
    readonly MIN_INT: number;

    /**
     * Positive infinity.
     * Alias of Number.POSITIVE_INFINITY.
     */
    readonly INFINITY: number;

    /** Random number tools. */
    readonly random: Random.Fn;

    /** Rounds a number to the specified number of decimal places. */
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

    /** Formats a number into a display string. */
    toString(value?: number, maxDecimals?: number): string;
  };

  /**
   * Number predicate contracts.
   */
  export namespace Is {
    /** Predicates over number values. */
    export type Lib = {
      /** True when the input is a finite number. */
      finite(input?: unknown): input is number;

      /** True when the input is an integer number. */
      int(input?: unknown): input is number;

      /** True when the input is a safe integer number. */
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
      /** Tools for working with percentage ranges. */
      readonly Range: Range.Lib;

      /** Convert a value to a percentage. */
      clamp(value?: string | number, min?: string | number, max?: string | number): t.Percent;

      /** Determine if the number represents a percentage (0..1). */
      isPercent(value?: t.PixelOrPercent): value is number;

      /** Determine if the number represents pixels (> 1). */
      isPixels(value?: t.PixelOrPercent): value is number;

      /** Convert a percentage to a "100%" string. */
      toString(value?: t.Percent): string;
    };

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
         * Returns 0 ..1, clamped if the input is outside the range.
         */
        toPercent(value: number, range: t.MinMaxNumberRange): number;

        /**
         * Convert a slider percent (0 … 1) → real value within the range.
         * Percent is clamped, output is always within [min, max].
         */
        fromPercent(percent: number, range: t.MinMaxNumberRange): number;

        /** Determine if the given input is a valid range. */
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
      /** Parse a ratio from string or number. "16/9" → 1.777… */
      parse(value?: string | number): number | undefined;

      /** Convert a decimal ratio → best fraction within a max denominator. */
      toFraction(value?: number, maxDenominator?: number): { num: number; den: number } | undefined;

      /** Format a ratio as "A/B" (or "X.XXX/1" fallback). */
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

      /** Random integer in [min, max] (inclusive). */
      int(min: number, max: number, opts?: Options): number;
    };

    /** Options for random number generation. */
    export type Options = {
      /**
       * Random source to use.
       * - 'math': Math.random (default)
       * - 'crypto': crypto.getRandomValues
       * - fn: custom RNG that must return [0, 1)
       */
      readonly source?: Source;
    };

    /** Random source selector or custom RNG returning values in [0, 1). */
    export type Source = 'math' | 'crypto' | (() => number);
  }
}
