import type { t } from './common.ts';
import { render } from './u.render.tsx';
import { PreloadPortal as Portal } from './ui.tsx';

export const Preload: t.PreloadLib = {
  Portal,
  render,
};
