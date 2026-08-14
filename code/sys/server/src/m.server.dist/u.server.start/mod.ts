import type { t } from './common.ts';
import { DEFAULT_DEPENDENCIES, type StartDependencies } from './common.ts';
import { serve, serveLocalWith, serveWith } from './u.serve.ts';
import { start, startLocalWith, startWith } from './u.start.ts';

/** Explicit locally verified, unpinned authority family. */
export const Local: t.DistServer.Local.Lib = Object.freeze({
  start: (input) => startLocalWith(input, DEFAULT_DEPENDENCIES),
  serve: (input) => serveLocalWith(input, DEFAULT_DEPENDENCIES),
});

export { DEFAULT_DEPENDENCIES, serve, serveLocalWith, serveWith, start, startLocalWith, startWith };
export type { StartDependencies };
