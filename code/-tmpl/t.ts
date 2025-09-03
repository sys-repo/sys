/**
 * 🐷
 * NB: placeholder type exports to ensure template imports don't error.
 */

/**
 * @system
 */
export type * from '@sys/types/t';

/**
 * @local
 */
export type { TemplateName } from './m.Templates.ts';

/**
 * @templates
 */
export type * from './tmpl.m.mod.ui/t.ts';
export type * from './tmpl.m.mod/t.ts';
export type * from './tmpl.pkg.deno/src/common/t.ts';
