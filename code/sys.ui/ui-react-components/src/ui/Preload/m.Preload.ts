import type { PreloadLib } from './t.ts';

import { render } from './u.render.tsx';
import { PreloadPortal as Portal } from './ui.tsx';

export const Preload: PreloadLib = {
  Portal,
  render,
};
