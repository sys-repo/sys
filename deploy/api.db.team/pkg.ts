import type { t } from '@sys/types';
import { default as deno } from '../deno.json' with { type: 'json' };

const { name, version } = deno;
export const Pkg : t.Pkg = { name, version }
export const pkg = Pkg;
