import type { t } from '../common.ts';
import { events } from './u.events.ts';
import { size } from './u.size.ts';

export const Screen: t.CliScreenLib = {
  size,
  events,
};
