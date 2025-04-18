import { type t } from './common.ts';
import { stack } from './m.Render.stack.tsx';
import { preload } from './m.Render.preload.tsx';

/**
 * Render functions for display content.
 */
export const AppRender: t.AppRenderLib = {
  stack,
  preload,
} as const;
