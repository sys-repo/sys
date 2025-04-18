import type { t } from './common.ts';

/**
 * Tools for rendering the application structure.
 */
export type AppRenderLib = {
  stack: (state: t.AppSignals | undefined) => t.ReactNode;

  /**
   * Ensure the specified ESM content modules have been dyanamically imported.
   */
  preload<T extends string>(
    state: t.AppSignals,
    factory: (flag: T) => Promise<t.Content | undefined>,
    ...content: T[]
  ): Promise<void>;
};
