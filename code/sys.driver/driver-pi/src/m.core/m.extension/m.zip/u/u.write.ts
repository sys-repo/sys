import { Fs } from '@sys/fs';
import type { t } from '../common.ts';
import { makeArtifact } from './u.make.ts';

/**
 * Materialize only policy-selected entries before returning loader arguments.
 */
export async function writeExtension(
  input: t.PiZipExtension.WriteInput,
): Promise<t.PiZipExtension.WriteResult> {
  const path = Fs.join(input.cwd, '.pi', '@sys', 'extensions', 'zip', 'mod.read.ts');
  await Fs.write(path, makeArtifact(input.policy), { throw: true });
  const extractPath = input.policy.extract === 'cooperative'
    ? Fs.join(input.cwd, '.pi', '@sys', 'extensions', 'zip', 'mod.extract.ts')
    : undefined;
  if (extractPath) {
    await Fs.write(extractPath, makeArtifact(input.policy, 'extract'), { throw: true });
  }
  return Object.freeze({
    path,
    ...(extractPath ? { extractPath } : {}),
    args: Object.freeze([
      '--extension',
      path,
      ...(extractPath ? ['--extension', extractPath] : []),
    ]),
    policy: input.policy,
  });
}
