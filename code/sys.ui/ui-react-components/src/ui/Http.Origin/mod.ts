/**
 * @module
 * UI for surfacing HTTP Origin/Endpoint url value maps.
 */
import type { t } from './common.ts';
import { Uncontrolled } from './ui.tsx';
import { Controlled } from './ui.Controlled.tsx';
import { createController as controller } from './u.controller.ts';
import { Data } from './m.Data.ts';

export const HttpOrigin: t.HttpOriginLib = {
  Data,
  controller,
  UI: { Controlled, Uncontrolled },
};
