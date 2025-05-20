import { type t, D } from './common.ts';
import { values, toRatio, fromRatio } from './u.zoom.ts';
import { List } from './ui.Zoom.tsx';

export const Zoom: t.MediaZoomLib = {
  UI: { List },
  values,
  config: D.zoom,
  toRatio,
  fromRatio,
};
