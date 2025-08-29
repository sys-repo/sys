/**
 * 🐷
 * NB: placeholder type exports to ensure template imports don't error.
 */

/**
 * @system
 */
export type * from '@sys/types/t';

export type { TmplFilter, TmplWriteHandlerArgs } from '@sys/tmpl-engine/t';
export type { CssInput } from '@sys/ui-css/t';

/**
 * @local
 */
export type * from './m.mod/t.ts';
