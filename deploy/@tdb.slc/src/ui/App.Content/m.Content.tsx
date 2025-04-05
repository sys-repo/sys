import type { t } from './common.ts';
import { factory } from './m.Content.factory.tsx';
import { Render } from './m.Content.Render.ts';

export const AppContent = {
  Render,
  factory,

  /**
   * Ensure the specified ESM content modules have been dyanamically imported.
   */
  async preload<T extends string>(...content: T[]) {
    const loading = content.map((flag) => factory(flag as t.ContentStage));
    await Promise.all(loading);
  },
} as const;
