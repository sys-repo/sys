/**
 * @module
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
import type { t } from './common.ts';
import { parse } from './u.parse.ts';

export const Esm: t.EsmLib = { parse };
