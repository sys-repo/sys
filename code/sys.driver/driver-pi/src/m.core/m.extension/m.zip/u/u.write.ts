import { Fs } from '@sys/fs';
import type { t } from '../common.ts';
import { makeArtifact } from './u.make.ts';

/**
 * Materialize the single generated read-only ZIP extension entry.
 */
export async function writeExtension(
  input: t.PiZipExtension.WriteInput,
): Promise<t.PiZipExtension.WriteResult> {
  const path = Fs.join(input.cwd, '.pi', '@sys', 'extensions', 'zip', 'mod.read.ts');
  await Fs.write(path, makeArtifact(input.policy), { throw: true });
  return Object.freeze({ path, args: ['--extension', path], policy: input.policy });
}
