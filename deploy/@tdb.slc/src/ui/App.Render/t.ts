import type { t } from './common.ts';

/**
 * Tools for rendering the application structure.
 */
export type AppRenderLib = {
  stack: (state: t.AppSignals | undefined) => t.ReactNode;

  /**
   * TODO 🐷 move to Type: <VideoContent>.
   */
  preload<T extends string>(
    factory: (flag: T) => Promise<t.Content | undefined>,
    ...content: T[]
  ): Promise<void>;
};
