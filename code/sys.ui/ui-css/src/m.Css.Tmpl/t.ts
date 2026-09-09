import type { t } from './common.ts';

/**
 * CSS template contracts.
 */
export declare namespace CssTmpl {
  /**
   * Runtime library surface.
   */
  export type Lib = {
    /** Apply common CSS templates and convert them into standard CSS properties. */
    transform(input?: t.Style.Value | t.Falsy): t.Style.Props;

    /** Convert sloppy edge input into an edge property object. */
    toEdges(input?: t.CssEdges.Input | t.Falsy, mutater?: t.CssEdges.Mutater): t.Style.Props;
  };

  /** Capitalized CSS template fields expanded into standard CSS properties. */
  export type Templates = {
    Absolute?: t.CssEdges.Input;
    Margin?: t.CssEdges.Input;
    MarginX?: t.CssEdges.XYInput;
    MarginY?: t.CssEdges.XYInput;
    Padding?: t.CssEdges.Input;
    PaddingX?: t.CssEdges.XYInput;
    PaddingY?: t.CssEdges.XYInput;
    Size?: number | string | [number | string, number | string] | t.Falsy;
    Scroll?: boolean;
  };
}
