import { type t } from './common.ts';
import { preloadModule, preloadTimestamps } from './m.Render.preload.tsx';
import { stack } from './m.Render.stack.tsx';

/**
 * Render functions for display content.
 */
export const AppRender: t.AppRenderLib = {
  stack,
  preloadModule,
  preloadTimestamps,
} as const;
