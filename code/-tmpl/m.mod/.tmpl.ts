/**
 * Setup the template:
 */
import type { t } from '../common.ts';

export const dir = import.meta.dirname;
export default async function setup(e: t.TmplWriteHandlerArgs) {
  console.log('🐷 m.mod: setup template:', dir);
}
