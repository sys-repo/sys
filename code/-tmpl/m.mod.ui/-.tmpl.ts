import { type t, Fs } from '../common.ts';

/**
 * Setup the template:
 */
export const dir = import.meta.dirname;
export default async function setup(e: t.TmplWriteHandlerArgs) {
  console.log(`-------------------------------------------`);
  console.log('setup', dir);
  console.log('Fs', Fs);
}
