import type { t } from './common.ts';

/**
 * Definition of content structure.
 */
export type AppContent = {
  id: t.StringId;
  video?: { src: string };
  timestamps?: AppTimestamps;
  theme?: t.CommonTheme | ((state: t.AppSignals) => t.CommonTheme | undefined);
  solidBackground?: (state: t.AppSignals) => boolean;
};

/**
 * Time based content definition
 */
export type AppTimestamps = t.Timestamps<AppTimestamp>;
export type AppTimestamp = {
  /** Render the body content. */
  body?(props: AppTimestampProps): JSX.Element;
};

export type AppTimestampProps = {
  state: t.AppSignals;
};
