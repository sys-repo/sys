import { type t } from './common.ts';

import { UserHas } from '../m.Events/mod.ts';
import { Event } from './m.Dom.Event.ts';

/** DOM helper library for event containment and user-interaction state. */
export const Dom: t.Dom.Lib = {
  Event,
  UserHas,
};
