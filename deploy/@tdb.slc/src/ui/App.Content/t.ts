import type { t } from './common.ts';

/**
 * Definition of content structure.
 */
export type AppContent = {
  id: t.StringId;
  video?: { src: string };
  timestamps?: AppTimestamps;
};

/**
 * Time based content definition
 */
export type AppTimestamps = t.Timestamps<AppTimestamp>;
export type AppTimestamp = {
  /** Render the body content. */
  render?(props: AppTimestampProps): JSX.Element;
};

export type AppTimestampProps = {
  timestamp: t.StringTimestamp;
  state: t.AppSignals;
  theme: t.CommonTheme;
  style?: t.CssInput;
};
