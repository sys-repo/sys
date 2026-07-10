import { Arr, Fs, type t } from '../common.ts';
import { runtimeRoot } from '../../../m.cli/u.runtime.ts';
import { installCommand } from './u.deps.ts';
import { tmpRoot } from './u.paths.ts';

const PROTECTED_SEGMENTS = [
  ['.git'],
  ['.pi'],

  // Legacy wrapper-owned runtime scars. Keep these aligned with the sandbox
  // filesystem extension so OCR cannot read old control/runtime paths either.
  ['.tmp', 'pi.cli'],
  ['.tmp', 'pi.cli.pi'],
  ['.log', '@sys.driver-pi'],
  ['.log', '@sys.driver-pi.pi'],
] as const;

export function resolveExtensionPolicy(
  input: t.PiOcrExtension.Extension.PolicyInput,
): t.PiOcrExtension.Extension.Policy {
  const root = runtimeRoot(input.cwd, 'Pi OCR extension');
  const readRoots = resolveReadRoots(root, input.read ?? []);

  return {
    readRoots,
    protectedRoots: protectedRoots(root),
    tmpRoot: tmpRoot(root),
    pdf: input.policy.pdf,
    executables: input.executables,
    installCommand: input.installCommand ?? installCommand(),
  };
}

function resolveReadRoots(root: string, paths: readonly string[]) {
  return Arr.uniq([root, ...paths.map((path) => Fs.resolve(root, path))]);
}

function protectedRoots(root: string) {
  return PROTECTED_SEGMENTS.map((segments) => Fs.join(root, ...segments));
}
