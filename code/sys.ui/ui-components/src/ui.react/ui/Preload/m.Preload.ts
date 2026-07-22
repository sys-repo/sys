import type { PreloadLib } from './t.ts';

import { render } from './u.render.tsx';
import { PreloadPortal as Portal } from './ui.tsx';

/** Preload portal renderer and direct render helper. */
export const Preload: PreloadLib = {
  Portal,
  render,
};
