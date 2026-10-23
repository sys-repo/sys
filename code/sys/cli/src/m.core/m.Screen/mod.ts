import type { t } from '../common.ts';
import { bottom } from './u.dock.bottom.ts';
import { events } from './u.events.ts';
import { repaint } from './u.repaint.ts';
import { size } from './u.size.ts';

const Dock: t.CliScreen.Dock.Lib = Object.freeze({ bottom });

export const Screen: t.CliScreen.Lib = Object.freeze({
  size,
  events,
  repaint,
  Dock,
});
