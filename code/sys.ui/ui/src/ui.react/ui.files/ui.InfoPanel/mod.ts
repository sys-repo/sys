import type { t } from './common.ts';
import { InfoPanelConfig } from '../ui.InfoPanel.Config/mod.ts';
import { Controlled } from './ui.Controlled.tsx';
import { InfoPanel as Uncontrolled } from './ui.tsx';
import { createController as controller } from './u.controller.ts';

/**
 * Public Files.InfoPanel runtime surface.
 */
export const InfoPanel: t.Files.InfoPanel.Lib = {
  UI: { Uncontrolled, Controlled },
  Config: InfoPanelConfig,
  controller,
};
