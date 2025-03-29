import type { t } from './common.ts';

/**
 * Definition of content structure.
 */
export type Content = {
  /** Content identifier. */
  id: t.StringId;

  /** The video for the content. */
  video?: { src: string };

  /** Map of content that changes at differing timestamps. */
  timestamps?: ContentTimestamps;

  /**
   * Render the base content.
   *    Additional items (such as the current timestamp) are
   *    rendered into the {children} property.
   */
  render?(props: ContentProps): t.ReactNode;
};

/**
 * Time based content definition
 */
export type ContentTimestamps = t.Timestamps<ContentTimestamp>;
export type ContentTimestamp = {
  /** Render the content for the current timestamp. */
  render?(props: ContentTimestampProps): t.ReactNode;
};

/**
 * Component Props:
 */
type CommonProps = {
  /** The index within the content-stack. */
  index: t.Index;
  /** Flag indicating if this is the current top-level view in the stack. */
  isTop: boolean;
  content: t.Content;
  state: t.AppSignals;
  breakpoint: t.Breakpoint;
  theme: t.CommonTheme;
  style?: t.CssInput;
};
export type ContentProps = CommonProps & { children?: React.ReactNode };
export type ContentTimestampProps = ContentProps & { timestamp: t.StringTimestamp };
