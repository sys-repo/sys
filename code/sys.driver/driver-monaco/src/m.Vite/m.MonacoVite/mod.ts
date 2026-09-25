/**
 * @module
 * Monaco runtime asset integration for Vite applications.
 */
import { type t } from './common.ts';
import { plugin } from './m.plugin.ts';

/** Monaco runtime asset integration for Vite applications. */
export const MonacoVite: t.MonacoVite.Lib = { plugin };
