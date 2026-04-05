/**
 * @module
 */
import type { t } from './common.ts';
import { D } from './common.ts';
import { Controlled, Uncontrolled } from './ui.tsx';

export const HttpOrigin: t.HttpOrigin.Lib = {
  UI: { Controlled, Uncontrolled },
  Default: { spec: D.spec },
};
