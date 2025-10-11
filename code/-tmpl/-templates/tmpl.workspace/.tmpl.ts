import { type t, Fs } from '../common.ts';

/**
 * Setup the template (after copy):
 */
export default async function setup(dir: t.StringAbsoluteDir) {
  // Clean up filenames:
  await Fs.move(Fs.join(dir, '-deno.json'), Fs.join(dir, 'deno.json'));
}
