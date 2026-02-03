/**
 * @module
 * UI for surfacing the ClientLoader HTTP fetch tools.
 */
import type { t } from './common.ts';
import { Uncontrolled } from './ui.tsx';
import { Controlled } from './ui.Controlled.tsx';
import { createController as controller } from './u.controller.ts';

export const HttpOrigin: t.HttpOriginLib = {
  controller,
  UI: {
    Uncontrolled,
    Controlled,
  },
};
