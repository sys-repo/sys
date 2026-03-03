/**
 * 🐷
 * NB: placeholder type exports to ensure template imports don't error.
 */

/**
 * @system
 */
export type * from '@sys/types/t';

/**
 * @templates
 */
export type * from './tmpl.m.mod.ui/t.ts';
export type * from './tmpl.m.mod.ui.controller-signal/t.ts';
export type * from './tmpl.m.mod/t.ts';
export type * from './tmpl.pkg.deno/src/common/t.ts';

/** Local module types. */
export * from '../src/common/t.ts';
