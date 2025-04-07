import type { t } from './common.ts';

/**
 * The content stages of the view.
 */
export type ContentStage = 'Entry' | 'Trailer' | 'Overview' | 'Programme';

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

export type ContentFlags = {
  /** Flag indicating if this is the current top-level view in the stack. */
  top: boolean;
  /** Flag indicating if this is the bottom most view in the stack. */
  bottom: boolean;
};

/**
 * Component Props:
 */
type CommonProps = {
  /** The index within the content-stack. */
  index: t.Index;
  is: t.ContentFlags;
  content: t.Content;
  state: t.AppSignals;
  breakpoint: t.Breakpoint;
  theme: t.CommonTheme;
  style?: t.CssInput;
};
export type ContentProps = CommonProps & { children?: React.ReactNode };
export type ContentTimestampProps = ContentProps & { timestamp: t.StringTimestamp };
