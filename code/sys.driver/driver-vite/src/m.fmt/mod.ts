/**
 * @module
 * Logging tools for rendering state/info to the console.
 */
import type { t } from './common.ts';

import { API } from './u.API.ts';
import { Bundle } from './u.Bundle.ts';
import { Dist } from './u.Dist.ts';
import { Help } from './u.Help.ts';
import { Module } from './u.Module.ts';
import { digest, elapsed, pad } from './u.ts';

export const ViteLog: t.ViteLog.Lib = {
  Help,
  API,

  Module,
  Bundle,
  Dist,

  digest,
  elapsed,
  pad,
};
