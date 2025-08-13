import type { AppRenderLib } from './t.ts';

import { preloadModule, preloadTimestamps } from './m.Render.preload.tsx';
import { stack } from './m.Render.stack.tsx';

/**
 * Render functions for display content.
 */
export const AppRender: AppRenderLib = {
  stack,
  preloadModule,
  preloadTimestamps,
} as const;
