import type { t } from './common.ts';
import { Controlled } from './ui.Controlled.tsx';
import { InfoPanel as Uncontrolled } from './ui.tsx';
import { createController as controller } from './u.controller.ts';

/**
 * Public Files.InfoPanel runtime surface.
 */
export const InfoPanel: t.Files.InfoPanel.Lib = Object.assign(Uncontrolled, {
  controller,
  UI: { Controlled, Uncontrolled },
});
