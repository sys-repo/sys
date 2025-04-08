import { type t } from './common.ts';
import { stack } from './m.Render.stack.tsx';

/**
 * Render functions for display content.
 */
export const AppRender: t.AppRenderLib = {
  stack,

  /**
   * Ensure the specified ESM content modules have been dyanamically imported.
   */
  async preload<T extends string>(
    factory: (flag: T) => Promise<t.Content | undefined>,
    ...content: T[]
  ) {
    const loading = content.map((flag) => factory(flag));
    const imports = await Promise.all(loading);

    console.log('imports', imports);
  },
} as const;
