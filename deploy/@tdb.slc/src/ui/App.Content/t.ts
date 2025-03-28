import type { t } from './common.ts';

/**
 * Definition of content structure.
 */
export type Content = {
  id: t.StringId;
  video?: { src: string };
  timestamps?: ContentTimestamps;
};

/**
 * Time based content definition
 */
export type ContentTimestamps = t.Timestamps<ContentTimestamp>;
export type ContentTimestamp = {
  /** Render the body content. */
  render?(props: TimestampProps): JSX.Element;
};

export type TimestampProps = {
  timestamp: t.StringTimestamp;
  state: t.AppSignals;
  theme: t.CommonTheme;
  style?: t.CssInput;
};
