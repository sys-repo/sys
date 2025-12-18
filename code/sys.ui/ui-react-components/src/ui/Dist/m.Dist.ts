import type { t } from './common.ts';
import { Dist as BaseUI } from './ui.tsx';
import { Browser, useBrowserController } from './ui.browser/mod.ts';

const UI = BaseUI as unknown as t.Mutable<t.DistUI>;
UI.Browser = Browser;

export const Dist: t.DistLib = {
  UI: UI as t.DistUI,
  useBrowserController,
};
