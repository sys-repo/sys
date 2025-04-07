import { type t } from './common.ts';
import { stack } from './m.Content.Render.stack.tsx';

/**
 * Render functions for display content.
 */
export const Render = {
  stack,

  /**
   * Ensure the specified ESM content modules have been dyanamically imported.
   */
  async preload<T extends string>(
    factory: (flag: T) => Promise<t.Content | undefined>,
    ...content: T[]
  ) {
    // const m = renderStack()

    /**
     * TODO 🐷
     *    - render into off-screen portal.
     *
     */
    const loading = content.map((flag) => factory(flag));
    const imports = await Promise.all(loading);

    console.log('imports', imports);
  },
} as const;
