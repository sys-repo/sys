import type { t } from './common.ts';
import { D, type StartDependencies } from './common.ts';
import { serve, serveLocal, serveLocalWith, serveWith } from './u.serve.ts';
import { start, startLocalWith, startWith } from './u.start.ts';

/** Explicit locally verified, unpinned authority family. */
export const Local: t.DistServer.Local.Lib = Object.freeze({
  start: (input) => startLocalWith(input, D.DEPS),
  serve: serveLocal,
});

export { serve, start };

/** Package-internal deterministic dependency seams. */
export { D, serveLocalWith, serveWith, startLocalWith, startWith };
export type { StartDependencies };
