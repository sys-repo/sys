import type { t } from './common.ts';
import { Dist as BaseUI } from './ui.tsx';
import { Browser } from './ui.Browser.tsx';

const UI = BaseUI as unknown as t.Mutable<t.DistUI>;
UI.Browser = Browser;

export const Dist: t.DistLib = {
  UI: UI as t.DistUI,
};
