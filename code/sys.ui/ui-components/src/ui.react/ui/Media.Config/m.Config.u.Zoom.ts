import type { MediaZoomLib } from './t.ts';

import { D } from './common.ts';
import { fromRatio, toRatio, values } from './u.zoom.ts';
import { List } from './ui.Zoom.tsx';

export const Zoom: MediaZoomLib = {
  UI: { List },
  values,
  config: D.zoom,
  toRatio,
  fromRatio,
};
