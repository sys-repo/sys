import type { t } from '../common.ts';
import { events } from './u.events.ts';
import { repaint } from './u.repaint.ts';
import { size } from './u.size.ts';

export const Screen: t.CliScreen.Lib = {
  size,
  events,
  repaint,
};
