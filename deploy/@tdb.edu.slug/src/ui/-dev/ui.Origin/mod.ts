/**
 * @module
 * UI for surfacing the ClientLoader HTTP fetch tools.
 */
import type { t } from './common.ts';
import { Origin } from './ui.tsx';
import { OriginControlled } from './ui.Controlled.tsx';
import { createController as controller } from './u.controller.ts';

export const DevOrigin: t.DevOriginLib = {
  controller,
  UI: {
    Uncontrolled: Origin,
    Controlled: OriginControlled,
  },
};
