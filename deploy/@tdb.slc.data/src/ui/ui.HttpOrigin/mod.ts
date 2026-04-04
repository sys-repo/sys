/**
 * @module
 */
import type { t } from './common.ts';
import { D } from './common.ts';
import { HttpOrigin as UI } from './ui.tsx';

export const HttpOrigin: t.HttpOrigin.Lib = {
  UI,
  Default: { spec: D.spec },
};
