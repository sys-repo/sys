import type { t } from './common.ts';

/**
 * Text label component contracts.
 */
export declare namespace TextLabel {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    /**
     * Formats one CommonMark paragraph: text, strong, emphasis and Chip-backed code.
     * Unsupported inline spans stay literal. Other document shapes, parse failures or failed source
     * recovery make the entire value literal. Recovered text preserves source spelling but remains
     * subject to CSS whitespace processing.
     * No interactive descendants or synthesized accessible name; hosts own non-empty control names.
     */
    value: string;
    /**
     * Defaults to flow: inherit wrapping, bounding oversized Chips only. Truncate creates a one-line
     * label box; host adds no clipping. Finite bounds and shrinkable ancestors are host-owned.
     */
    overflow?: Overflow;
    debug?: boolean;
    /** Inherits text styling; caller overrides may change the clipping recipe. */
    style?: t.Style.Input;
  };

  /** Flow bounds individual Chips; truncate clips the label; host delegates all clipping outward. */
  export type Overflow = 'flow' | 'truncate' | 'host';
}
