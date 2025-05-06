import type { t } from './common.ts';

/**
 * Definition of content structure.
 */
export type Content<P = {}> = P & {
  /** Content identifier. */
  id: t.StringId;

  /**
   * Render the base content.
   *    Additional items (such as the current timestamp) are
   *    rendered into the {children} property.
   */
  render?(props: ContentProps<P>): t.ReactNode;
};

/**
 * Component Props:
 */
export type ContentProps<P = {}> = {
  /** The index within the content-stack. */
  index: t.Index;
  content: t.Content<P>;
  state: t.AppSignals;
  theme: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Flags pertaining to content.
 */
export type ContentFlags = {
  /** Flag indicating if this is the current top-level view in the stack. */
  top: boolean;
  /** Flag indicating if this is the bottom most view in the stack. */
  bottom: boolean;
};

/**
 * Syncronous of asynchronous content renderer.
 */
export type ContentRenderer = () => t.ReactNode;
