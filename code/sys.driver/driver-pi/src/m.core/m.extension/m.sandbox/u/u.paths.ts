import { Fs, type t } from '../common.ts';

const EXTENSION_DIR = ['.pi', '@sys', 'extensions'] as const;
const EXTENSION_NAME = 'sandbox.fs' as const;
const EXTENSION_ENTRY = 'mod.ts' as const;

/** Paths owned by the sandbox filesystem extension. */
export const SandboxFsPaths = {
  dirOf(cwd: t.StringDir) {
    return Fs.join(cwd, ...EXTENSION_DIR) as t.StringDir;
  },

  pathOf(cwd: t.StringDir) {
    return Fs.join(SandboxFsPaths.dirOf(cwd), EXTENSION_NAME, EXTENSION_ENTRY) as t.StringPath;
  },
} as const;
