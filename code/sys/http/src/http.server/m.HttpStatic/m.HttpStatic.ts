import type { t } from './common.ts';
import { Config } from './m.Config.ts';
import { resources } from './u.resources.ts';
import { start } from './u.start.ts';

/**
 * Static HTTP server lifecycle endpoint.
 */
export const HttpStatic: t.HttpStatic.Lib = { resources, start, Config };
