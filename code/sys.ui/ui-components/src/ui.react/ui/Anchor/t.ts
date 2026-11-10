import type { t } from './common.ts';

/**
 * Contracts for native anchors and resource/opening cues.
 */
export declare namespace Anchor {
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly Link: t.FC<Link.Props>;
  };
  export type Props = {
    /**
     * Anchor destination; missing/empty renders only children.
     * Callers own href parsing and validation policy.
     */
    href?: string;
    /** Retain standard-target completion while accepting named browsing contexts. */
    target?: Target | (string & Record<never, never>);
    rel?: string;
    title?: string;
    download?: boolean | string;
    children?: t.ReactNode;
    /**
     * Whether the rendered anchor permits navigation and caller event handlers.
     * False removes navigation attributes and excludes the anchor from the tab order.
     * @default true
     */
    enabled?: boolean;
    disabledOpacity?: t.Percent | false;

    /** Accessibility: */
    tabIndex?: number;
    /** Describes disabled state only; use enabled=false to disable interaction. */
    'aria-disabled'?: boolean;
    /** Space-separated IDs of caller-owned descriptions. */
    'aria-describedby'?: string;

    /**
     * Logical-order renderers, passed as='span' and size='1em' to follow the link's font size.
     * Callers must keep them decorative, non-interactive, and phrasing-safe.
     */
    icons?: {
      leading?: t.IconRenderer;
      trailing?: t.IconRenderer;
    };

    /** Appearance: */
    theme?: t.CommonTheme;
    /** Use monospace; omitted/false inherits the surrounding font. Caller style takes precedence. */
    mono?: boolean;
    /**
     * Enables single-line ellipsis for the whole anchor, not just its label.
     * Uses inline-block; constrain width with style.width or style.maxWidth.
     * Full children remain in the DOM, but trailing markers may be clipped.
     * Caller styles can override truncation. Omitted/false adds no truncation styles.
     * @default false
     */
    truncate?: boolean;
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

  /**
   * Adds an optional resource marker and an arrow for the requested opening context.
   * Missing/empty href returns children only. Disabled links retain the resource marker,
   * but generate no opening arrow or hint.
   */
  export namespace Link {
    /** Browser navigation references; handler schemes and downloads use Anchor.UI. */
    export type Props =
      & Omit<t.Anchor.Props, 'icons' | 'target' | 'download' | 'aria-disabled'>
      & {
        /** Meaningful destination label; rich, non-interactive phrasing content is supported. */
        children: t.ReactNode;
        /** Resource identity, not origin, trust, or availability. Omit for no resource marker. */
        resource?: 'web';
        /**
         * Requested ordinary opening context: self explicitly sets _self; new-tab requests _blank.
         * Browser preferences determine whether that context is a tab or window.
         * @default 'self'
         */
        openIn?: 'self' | 'new-tab';
        /**
         * Localized new-context explanation, never appended to the visible label.
         * Omitted/blank uses "Opens in a new tab"; not a hide switch.
         * Available new-context links add an aria-describedby reference, retaining caller references.
         * Used as title only when title is undefined; an empty title does not suppress the description.
         * Glyph/title alone do not ensure advance warning for sighted keyboard or touch users.
         */
        openHint?: string;
      };
  }

  /** Standard HTML anchor browsing-context targets. */
  export type Target = '_self' | '_blank' | '_parent' | '_top';

  /** Events: */
  export type MouseEventAnchor = t.ReactMouseEvent<HTMLAnchorElement>;
  export type KeyboardEventAnchor = t.ReactKeyboardEvent<HTMLAnchorElement>;
}
