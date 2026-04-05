/**
 * @module
 * UI helpers for loading and selecting staged data mounts.
 */
import type { t } from './common.ts';
import { Mounts as UI } from './ui.tsx';
import { useController as Controller } from './use.Controller.ts';

export const Mounts: t.Mounts.Lib = {
  UI,
  use: { Controller },
};
