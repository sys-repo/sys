/**
 * @module
 * Logging tools for rendering state/info to the console.
 */
import type { t } from './common.ts';

import { Bundle } from './u.Bundle.ts';
import { Dist } from './u.Dist.ts';
import { Help } from './u.Help.ts';
import { Module } from './u.Module.ts';
import { UsageAPI } from './u.UsageAPI.ts';
import { digest, pad } from './u.ts';

export const ViteLog: t.ViteLogLib = {
  Help,
  UsageAPI,

  Module,
  Bundle,
  Dist,

  digest,
  pad,
};
