import { type t } from './common.ts';

import { UserHas } from '../m.Events/mod.ts';
import { Event } from './m.Dom.Event.ts';
import { Interactive } from './m.Dom.Interactive.ts';

/** DOM helper library for event containment, interactive targets, and user-interaction signals. */
export const Dom: t.Dom.Lib = {
  Event,
  Interactive,
  UserHas,
};
