import { type t } from './common.ts';
import { renderStack } from './m.Content.Render.stack.tsx';

/**
 * Render functions for display content.
 */
export const Render = {
  stack: renderStack,

  /**
   * Ensure the specified ESM content modules have been dyanamically imported.
   */
  async preload<T extends string>(
    factory: (flag: T) => Promise<t.Content | undefined>,
    ...content: T[]
  ) {
    const loading = content.map((flag) => factory(flag));
    await Promise.all(loading);
  },
} as const;
