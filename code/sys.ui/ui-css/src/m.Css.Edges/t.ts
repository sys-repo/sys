import type { t } from './common.ts';

type N = number | string | null | undefined;

/**
 * Edge value formatting contracts.
 */
export declare namespace CssEdges {
  /**
   * Runtime library surface.
   */
  export type Lib = {
    /** Convert sloppy inputs into a clean edges array. */
    toArray(input: Input, defaultValue?: Default): Array;

    /** Convert sloppy inputs into a clean edges array on the X-dimension (horizontal). */
    toArrayX(input: XYInput, defaultValue?: Default): Array;

    /** Convert sloppy inputs into a clean edges array on the Y-dimension (vertical). */
    toArrayY(input: XYInput, defaultValue?: Default): Array;

    /** Convert CSS shorthand input into [top, right, bottom, left] shape fields. */
    toEdges: ToEdges<Shape>;

    /** Converts input to CSS margin edges. */
    toMargins: ToEdges<Margin.Shape>;

    /** Converts input to CSS padding edges. */
    toPadding: ToEdges<Padding.Shape>;
  };

  /** Default value for an edge. */
  export type Default = N;

  /** Callback that mutates the results of the `toEdges` function. */
  export type Mutater = (e: MutaterArgs) => void;

  /** Arguments passed to an edge mutater. */
  export type MutaterArgs = {
    readonly current: { readonly value?: N; readonly edge: keyof Shape };
    changeValue(next: N): void;
    changeField(next: keyof t.Style.Props | null): void;
  };

  /** Transformer that converts edge value inputs to an edge object. */
  export type ToEdges<T> = (
    input?: Input | [],
    options?: { defaultValue?: Input },
  ) => Partial<T>;

  /** Value representing an edge. */
  export type ValueInput = N;

  /** Four-part CSS edge tuple: [top, right, bottom, left]. */
  export type Quad = [N, N, N, N];

  /** Loose input for edges around a 4-sided entity. */
  export type Input = N | [N] | [N, N] | Quad;

  /** Loose input for a single edge dimension (X/Y). */
  export type XYInput = N | [N] | [N, N];

  /** Edges for a 4-sided entity. */
  export type Shape = {
    top: string | number;
    right: string | number;
    bottom: string | number;
    left: string | number;
  };

  /** Array of edge values: [top, right, bottom, left]. */
  export type Array = [N, N, N, N];

  /**
   * Margin edge contracts.
   */
  export namespace Margin {
    /** Loose input for margin edges. */
    export type Input = CssEdges.Input;

    /** Margin edge tuple. */
    export type Array = CssEdges.Array;

    /** CSS margin edge fields. */
    export type Shape = {
      marginTop: string | number;
      marginRight: string | number;
      marginBottom: string | number;
      marginLeft: string | number;
    };
  }

  /**
   * Padding edge contracts.
   */
  export namespace Padding {
    /** Loose input for padding edges. */
    export type Input = CssEdges.Input;

    /** Padding edge tuple. */
    export type Array = CssEdges.Array;

    /** CSS padding edge fields. */
    export type Shape = {
      paddingTop: string | number;
      paddingRight: string | number;
      paddingBottom: string | number;
      paddingLeft: string | number;
    };
  }
}
