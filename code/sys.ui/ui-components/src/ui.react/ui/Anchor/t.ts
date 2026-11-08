import type { t } from './common.ts';

/**
 * Canonical UI primitive for rendering secure-by-default HTML anchor (`<a>`) links.
 */
export declare namespace Anchor {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    /**
     * Anchor destination.
     * Callers own href parsing and validation policy.
     */
    href?: string;
    /** Retain standard-target completion while accepting named browsing contexts. */
    target?: Target | (string & Record<never, never>);
    rel?: string;
    title?: string;
    download?: boolean | string;
    children?: t.ReactNode;
    enabled?: boolean;
    disabledOpacity?: t.Percent | false;

    /**
     * Accessibility:
     * Callers may mark the anchor as disabled while still rendering `<a>`.
     */
    tabIndex?: number;
    'aria-disabled'?: boolean;

    /** Appearance: */
    theme?: t.CommonTheme;
    /**
     * Uses Button's shared outline recipe and 1px root radius; override radius with `borderRadius`.
     * Customize outline paint with `--sys-anchor-focus-` tokens:
     * `accent`, `rest`, `width`, `offset`. Use explicit CSS lengths for width/offset.
     * The 20%-blue resting colour has low contrast on white/Dark; choose for the actual surface.
     * A supplied `:focus-visible` block replaces the entire default focus policy and underline.
     */
    style?: t.CssInput;

    /**
     * Events (pass-through).
     * Keep the surface intentionally small; expand only for real callers.
     */
    onClick?: (e: MouseEventAnchor) => void;
    onMouseDown?: (e: MouseEventAnchor) => void;
    onMouseUp?: (e: MouseEventAnchor) => void;
    onKeyDown?: (e: KeyboardEventAnchor) => void;
    onKeyUp?: (e: KeyboardEventAnchor) => void;
  };

  /** Standard HTML anchor browsing-context targets. */
  export type Target = '_self' | '_blank' | '_parent' | '_top';

  /** Events: */
  export type MouseEventAnchor = t.ReactMouseEvent<HTMLAnchorElement>;
  export type KeyboardEventAnchor = t.ReactKeyboardEvent<HTMLAnchorElement>;
}
