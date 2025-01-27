/**
 * @module
 * Logging tools for rendering state/info to the console.
 */
import type { t } from './common.ts';

import { Bundle } from './u.Bundle.ts';
import { Dist } from './u.Dist.ts';
import { Help } from './u.Help.ts';
import { Module } from './u.Module.ts';
import { API } from './u.API.ts';
import { digest, pad } from './u.ts';

export const ViteLog: t.ViteLogLib = {
  Help,
  API,

  Module,
  Bundle,
  Dist,

  digest,
  pad,
};
