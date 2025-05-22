import { type t } from './common.ts';
import { Filters } from './m.Config.u.Filters.ts';
import { Zoom } from './m.Config.u.Zoom.ts';
import { Slider } from './ui.Slider.tsx';

export const Config: t.MediaConfigLib = {
  Filters,
  Zoom,
  UI: { Slider },
};
