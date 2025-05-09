import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Tools for rendering the application structure.
 */
export type AppRenderLib = {
  stack: (state: t.AppSignals | undefined) => t.ReactNode;

  /**
   * Ensure the specified ESM content modules have been dyanamically imported.
   */
  preloadModule<T extends string>(
    state: t.AppSignals,
    factory: (flag: T) => Promise<t.Content | undefined>,
    content: T[],
  ): Promise<void>;

  /**
   * Forces a preload of the timestamps within the given content object.
   * NB: performs a deep walk of the content.
   */
  preloadTimestamps(content?: O | O[]): void;
};
