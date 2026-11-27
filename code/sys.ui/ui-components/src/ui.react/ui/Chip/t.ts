import type { t } from './common.ts';

/**
 * Compact inline visual token.
 */
export declare namespace Chip {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Size = 'xs' | 'sm' | 'md';
  export type Props = {
    children?: t.ReactNode;
    size?: Size;
    mono?: boolean;
    /**
     * Opt-in single-line ellipsis for text or non-interactive inline content.
     * The host supplies a finite containing width (with room for padding/border),
     * shrinkable grid/flex ancestors, and the wrapping policy. Fits the whole chip within
     * that width; a token that fits a fresh line moves intact, not into the remaining space.
     * Full children remain in the DOM. Omitted/false retains intrinsic, unclipped output.
     * To ellipsize token text at an ancestor, use false and non-atomic inline composition;
     * false alone is insufficient. Root style overrides can change the bound.
     * @default false
     */
    truncate?: boolean;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };
}
