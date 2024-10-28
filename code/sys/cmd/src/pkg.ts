import type { t } from '@sys/types';
import { default as deno } from '../deno.json' with { type: 'json' };

const { name, version } = deno;


/**
 * Package meta-data.
 */
export const pkg: t.Pkg = { name, version };
