import type { t } from './common.ts';
import { Controlled } from './ui.Controlled.tsx';
import { InfoPanel as Uncontrolled } from './ui.tsx';
import { createController as controller } from './u.controller.ts';

export const InfoPanel: t.Files.InfoPanel.Lib = Object.assign(Uncontrolled, {
  controller,
  UI: { Controlled, Uncontrolled },
});
