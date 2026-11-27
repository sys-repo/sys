import type { t } from './common.ts';

/**
 * Native anchors and buttons that share an inline link appearance.
 */
export declare namespace Anchor {
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly Link: t.FC<Link.Props>;
    readonly Button: t.FC<Button.Props>;
  };

  export type Props = SharedProps & {
    /**
     * Anchor destination; missing/empty renders only children.
     * Callers own href parsing and validation policy.
     */
    href?: string | undefined;
    /** Retain standard-target completion while accepting named browsing contexts. */
    target?: Target | (string & Record<never, never>);
    rel?: string;
    download?: boolean | string;
    children?: t.ReactNode;
    /** Describes disabled state only; use enabled=false to disable interaction. */
    'aria-disabled'?: boolean;

    /**
     * Logical-order renderers, passed as='span' and size='1em' to follow the link's font size.
     * Callers must keep them decorative, non-interactive, and phrasing-safe.
     */
    icons?: {
      leading?: t.IconRenderer;
      trailing?: t.IconRenderer;
    };

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
   * Missing or empty `href` renders only children, even with `onClick`.
   * Disabled links retain the resource marker, but generate no opening arrow or hint.
   */
  export namespace Link {
    /** Browser navigation references; handler schemes and downloads use Anchor.UI. */
    export type Props =
      & Omit<t.Anchor.Props, 'icons' | 'target' | 'download' | 'aria-disabled'>
      & {
        /** Meaningful destination label; rich, non-interactive phrasing content is supported. */
        children: t.ReactNode;
        /** Resource identity, not origin, trust, or availability. Omit for no resource marker. */
        resource?: 'web' | undefined;
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

  /** A native non-submit button with the visual treatment of an inline link. */
  export namespace Button {
    export type Props = SharedProps & {
      /** Non-interactive phrasing content; provide an accessible name for icon-only buttons. */
      children: t.ReactNode;
      onClick: (event: t.ReactMouseEvent<HTMLButtonElement>) => void;
      'aria-label'?: string;
      'aria-labelledby'?: string;
      'aria-expanded'?: boolean;
      'aria-controls'?: string;
    };
  }

  /** Standard HTML anchor browsing-context targets. */
  export type Target = '_self' | '_blank' | '_parent' | '_top';

  /** Events: */
  export type MouseEventAnchor = t.ReactMouseEvent<HTMLAnchorElement>;
  export type KeyboardEventAnchor = t.ReactKeyboardEvent<HTMLAnchorElement>;
}

/** Props honored by both the native anchor and the action button. */
type SharedProps = {
  title?: string;
  /**
   * Disabled anchors lose navigation attributes, caller handlers and their tab stop;
   * buttons use native `disabled`.
   * @default true
   */
  enabled?: boolean;
  disabledOpacity?: t.Percent | false;
  tabIndex?: number;
  /** Space-separated IDs of caller-owned descriptions. */
  'aria-describedby'?: string;
  theme?: t.CommonTheme;
  /** Use monospace; omitted/false inherits the surrounding font. Caller style takes precedence. */
  mono?: boolean;
  /**
   * Single-line ellipsis for the whole control. Constrain width with `style.width` or `style.maxWidth`.
   * Uses inline-block; children remain in the DOM, but trailing markers may be clipped.
   * Caller styles can override truncation. Omitted/false adds no truncation styles.
   * @default false
   */
  truncate?: boolean;
  /**
   * Eligible single boxes use the shared Button halo; wrapped links keep their native outline.
   * A supplied `:focus-visible` block replaces the default focus styling and underline.
   */
  style?: t.CssInput;
};
