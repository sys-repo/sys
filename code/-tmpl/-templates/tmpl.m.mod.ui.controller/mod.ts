/**
 * @module
 */
import type { t } from './common.ts';
import { Uncontrolled } from './ui.tsx';
import { Controlled } from './ui.Controlled.tsx';
import { createController as controller } from './u.controller.ts';

export const MyCtrl: t.MyCtrlLib = {
  controller,
  UI: {
    Controlled,
    Uncontrolled,
  },
};
