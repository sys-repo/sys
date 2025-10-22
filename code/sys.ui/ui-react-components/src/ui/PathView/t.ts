import type { t } from './common.ts';

/**
 * PathView
 * Renders an object path with optional prefix.
 */
export type PathViewProps = {
  /** Path to render, e.g. `['foo', 'bar']`. */
  path?: t.ObjectPath;

  /** Optional prefix label before the path (e.g. 'path:' or an icon). */
  prefix?: string;

  /** Optional color override for prefix text. */
  prefixColor?: string;

  /** Truncate long segments to this max length (default: 20). */
  maxSegmentLength?: number;
  /** Horizontal spacing between path segments. */
  segmentGap?: t.Pixels;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  /** Invoked when a path segment is clicked. */
  onClick?: t.PathViewClickHandler;
};

/**
 * PathView click event.
 */
export type PathViewClickHandler = (e: PathViewClick) => void;
/** Fired when a path segment is clicked. */
export type PathViewClick = {
  kind: 'segment';
  /** Object path context for the click. */
  path: {
    /** The segment path leading up to the clicked element. */
    at: t.ObjectPath;
    /** The zero-based index of the clicked segment within the full path. */
    atIndex: t.Index;
    /** The actual key (string or number) of the clicked segment. */
    atKey: string | number;
    /** The full path represented by the component. */
    full: t.ObjectPath;
  };
};
