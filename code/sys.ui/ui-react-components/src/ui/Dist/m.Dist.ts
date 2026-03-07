import type { t } from './common.ts';
import { Browser, useBrowserController } from './ui.browser/mod.ts';
import { Dist as BaseUI } from './ui.tsx';

const UI = BaseUI as unknown as t.Mutable<t.Dist.UI>;
UI.Browser = Browser;

export const Dist: t.Dist.Lib = {
  UI: UI as t.Dist.UI,
  useBrowserController,
};
