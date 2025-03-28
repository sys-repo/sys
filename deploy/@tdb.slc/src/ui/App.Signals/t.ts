import type { t } from './common.ts';

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  video: t.VideoPlayerSignals;

  stage: t.Signal<t.Stage>;
  dist: t.Signal<t.DistPkg | undefined>;
  theme: t.Signal<t.CommonTheme>;

  background: {
    video: { opacity: t.Signal<number | undefined> };
  };

  /** Hook into all relevant value listeners. */
  listen(): void;
};

/**
 * Definition of content structure.
 */
export type AppContent = {
  id: t.StringId;
  timestamps: AppTimestamps;
};

/**
 * Time based content definition
 */
export type AppTimestamps = t.Timestamps<AppTimestamp>;
export type AppTimestamp = {
  //
};
