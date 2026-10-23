import { Fs, Is, type t } from './common.ts';

const MAX_EXECUTABLE_PATH_LENGTH = 4_096;
const FORBIDDEN_PERMISSION_LIST_INPUT = /[,\0\r\n]/;

export type ChromeExecutableValidationOptions = {
  /** Roots writable by the process that will launch Chrome. */
  readonly writableRoots?: readonly t.StringAbsolutePath[];
};

export type ChromeExecutableValidationDeps = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo | undefined>;
  readonly realPath: (path: string) => Promise<string>;
};

const DEFAULT_DEPS: ChromeExecutableValidationDeps = {
  lstat: Fs.lstat,
  realPath: Fs.realPath,
};

/** Validate one path before it enters Deno's comma-delimited run-permission transport. */
export function assertChromeExecutableInput(
  input: unknown,
): asserts input is t.StringAbsolutePath {
  if (!Is.str(input) || !input || input.length > MAX_EXECUTABLE_PATH_LENGTH) {
    throw new TypeError('Chrome executable path must be a nonempty bounded string.');
  }
  if (FORBIDDEN_PERMISSION_LIST_INPUT.test(input)) {
    throw new TypeError('Chrome executable path contains a forbidden permission-list character.');
  }
  if (!Fs.Path.Is.absolute(input) || Fs.resolve(input) !== input) {
    throw new TypeError('Chrome executable path must be normalized and absolute.');
  }
}

/**
 * Admit one canonical executable pathname.
 *
 * Deno binds run authority to a pathname rather than an immutable inode. The caller therefore
 * trusts external filesystem stability after this check; aliases and child-writable paths are
 * rejected to keep that trust boundary explicit.
 */
export async function validateChromeExecutable(
  input: unknown,
  options: ChromeExecutableValidationOptions = {},
  deps: ChromeExecutableValidationDeps = DEFAULT_DEPS,
): Promise<t.StringAbsolutePath> {
  assertChromeExecutableInput(input);

  const info = await deps.lstat(input);
  if (!info) throw new TypeError('Chrome executable path does not exist.');
  if (info.isSymlink) throw new TypeError('Chrome executable path must not be a symbolic link.');
  if (!info.isFile) throw new TypeError('Chrome executable path must identify a regular file.');

  const realPath = await deps.realPath(input);
  if (realPath !== input) {
    throw new TypeError('Chrome executable path must equal its canonical real path.');
  }
  if (Deno.build.os !== 'windows' && (!Is.num(info.mode) || (info.mode & 0o111) === 0)) {
    throw new TypeError('Chrome executable path must identify an executable file.');
  }

  for (const writableRoot of options.writableRoots ?? []) {
    assertAbsoluteRoot(writableRoot);
    const canonicalRoot = await canonicalRootPath(writableRoot, deps);
    if (isWithin(canonicalRoot, realPath)) {
      throw new TypeError('Chrome executable path must be outside proof-child write authority.');
    }
  }

  return input;
}

function assertAbsoluteRoot(input: string): asserts input is t.StringAbsolutePath {
  if (!Fs.Path.Is.absolute(input) || Fs.resolve(input) !== input) {
    throw new TypeError('Chrome writable root must be normalized and absolute.');
  }
}

async function canonicalRootPath(
  root: t.StringAbsolutePath,
  deps: ChromeExecutableValidationDeps,
) {
  try {
    return await deps.realPath(root);
  } catch {
    return root;
  }
}

function isWithin(root: string, path: string) {
  const relative = Fs.Path.relative(root, path);
  if (!relative) return true;
  if (Fs.Path.Is.absolute(relative)) return false;
  return relative.split(/[\\/]/)[0] !== '..';
}
