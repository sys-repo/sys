import { Fs, type t } from './common.ts';

const EXTENSION_DIR = ['.pi', '@sys', 'extensions'] as const;
const EXTENSION_FILE = 'sandbox.fs.ts' as const;

/** Paths owned by the sandbox filesystem extension. */
export const SandboxFsPaths = {
  dirOf(cwd: t.StringDir) {
    return Fs.join(cwd, ...EXTENSION_DIR) as t.StringDir;
  },

  pathOf(cwd: t.StringDir) {
    return Fs.join(SandboxFsPaths.dirOf(cwd), EXTENSION_FILE) as t.StringPath;
  },
} as const;
