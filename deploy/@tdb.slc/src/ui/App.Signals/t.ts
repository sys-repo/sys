import type { t } from './common.ts';

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  video: t.VideoPlayerSignals;
  props: {
    dist: t.Signal<t.DistPkg | undefined>;
    theme: t.Signal<t.CommonTheme>;
    content: t.Signal<t.AppContent | undefined>;
    background: {
      video: { opacity: t.Signal<number | undefined> };
    };
  };

  /** Hook into all relevant value listeners. */
  listen(): void;

  /** Load the given content into the model. */
  load(content?: t.AppContent): void;
};

/**
 * Definition of content structure.
 */
export type AppContent = {
  id: t.StringId;
  video?: { src: string };
  timestamps?: AppTimestamps;
  theme?: t.CommonTheme;
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
