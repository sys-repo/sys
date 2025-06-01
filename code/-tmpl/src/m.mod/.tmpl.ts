import { type t, Tmpl, tmplFilter } from '../common.ts';

/**
 * Define the template:
 */
export const dir = import.meta.dirname!;
export const tmpl = Tmpl.create(dir).filter(tmplFilter);

/**
 * Setup the template:
 */
export default async function setup(e: t.TmplWriteHandlerArgs) {
  console.log('🐷 m.mod: setup template:', dir);
}
