/**
 * @module
 * UI helpers for selecting and persisting staged-data HTTP origins.
 */
import type { t } from './common.ts';
import { D } from './common.ts';
import { Controlled, Uncontrolled } from './ui.tsx';
import { useController as Controller } from './use.Controller.ts';

export const HttpOrigin: t.HttpOrigin.Lib = {
  UI: { Controlled, Uncontrolled },
  Default: { env: D.env, spec: D.spec, verify: D.verify },
  use: { Controller },
};
