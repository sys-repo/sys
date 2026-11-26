/**
 * @module
 * Client lifecycle for passkey accounts. The host owns the runtime; the runtime coordinates browser
 * ceremonies and service requests, keeps the bearer in memory, and exposes session observations.
 */
import type { t } from './common.ts';
import { create } from './u/u.create.ts';

/**
 * Create an inactive runtime. Starting it checks browser support without opening a ceremony.
 */
export const AccountRuntime: t.AccountRuntime.Lib = Object.freeze({ create });
