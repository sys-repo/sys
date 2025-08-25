/**
 * Logging tools for rendering state/info to the console.
 * @module
 */
import type { ViteLogLib } from './t.ts';

import { API } from './u.API.ts';
import { Bundle } from './u.Bundle.ts';
import { Dist } from './u.Dist.ts';
import { Help } from './u.Help.ts';
import { Module } from './u.Module.ts';
import { digest, pad } from './u.ts';

export const ViteLog: ViteLogLib = {
  Help,
  API,

  Module,
  Bundle,
  Dist,

  digest,
  pad,
};
