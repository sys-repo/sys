import { type t } from './common.ts';
import { get, getLib } from './u.current.ts';
import { run, runLib } from './u.upgrade.run.ts';
import { status, statusLib } from './u.upgrade.status.ts';

export { get } from './u.current.ts';
export { run } from './u.upgrade.run.ts';
export { status } from './u.upgrade.status.ts';

/** Installed local Deno runtime version surface. */
export const Current: t.DenoVersion.Current.Lib = { get: getLib };

/** Deno runtime upgrade status and execution surface. */
export const Upgrade: t.DenoVersion.Upgrade.Lib = {
  status: statusLib,
  run: runLib,
};

/** Deno runtime version and upgrade helper library. */
export const DenoVersion: t.DenoVersion.Lib = {
  Current,
  Upgrade,
};
