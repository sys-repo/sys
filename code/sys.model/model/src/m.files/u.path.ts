import { Is, type t } from './common.ts';

const WINDOWS_DRIVE = /^[a-zA-Z]:/;

export type PathOps = {
  readonly Is: { readonly absolute: (path: t.StringPath) => boolean };
  readonly normalize: (path: t.StringPath) => t.StringPath;
};

export type PosixPathOps = PathOps & {
  readonly join: (...parts: readonly string[]) => t.StringPath;
  readonly resolve: (...parts: readonly string[]) => t.StringAbsolutePath;
  readonly relative: (from: t.StringPath, to: t.StringPath) => t.StringRelativePath;
};

export type InvalidPath = (message: string) => Error;

export type FilesPathLib = {
  readonly Is: {
    readonly windowsDrive: (input: t.StringPath) => boolean;
  };
  readonly visible: (ops: PathOps, input: unknown, invalid: InvalidPath) => t.Files.StringPath;
  readonly parent: (input: t.Files.StringPath) => t.Files.StringPath;
  readonly posix: () => PosixPathOps;
};

/** Shared Files path helpers for root-relative Files-visible paths. */
export const FilesPath: FilesPathLib = Object.freeze({
  Is: Object.freeze({
    windowsDrive(input: t.StringPath): boolean {
      return WINDOWS_DRIVE.test(input);
    },
  }),

  visible(ops, input, invalid) {
    if (input === undefined || input === '' || input === '.') return '';
    if (!Is.string(input)) throw invalid('Files path must be a string');
    if (input.includes('\0')) throw invalid('Files path contains NUL');
    if (input.includes('\\')) throw invalid('Files path must use POSIX separators');
    if (ops.Is.absolute(input) || FilesPath.Is.windowsDrive(input)) {
      throw invalid('Files path must be root-relative');
    }
    if (input.split('/').includes('..')) {
      throw invalid('Files path cannot traverse above root');
    }

    const normalized = ops.normalize(input).replaceAll('\\', '/');
    const path = normalized === '.' ? '' : normalized.replace(/^\.\/+/, '');
    if (path === '..' || path.startsWith('../') || path.includes('/../')) {
      throw invalid('Files path cannot traverse above root');
    }
    if (path.startsWith('/') || FilesPath.Is.windowsDrive(path)) {
      throw invalid('Files path must be root-relative');
    }
    return path;
  },

  parent(input) {
    const parts = input.split('/').filter(Boolean);
    parts.pop();
    return parts.join('/') as t.Files.StringPath;
  },

  posix() {
    return POSIX_PATH;
  },
});

const POSIX_IS = Object.freeze({ absolute: isAbsolute });

const POSIX_PATH: PosixPathOps = Object.freeze({
  Is: POSIX_IS,
  join(...parts) {
    return normalize(parts.join('/'));
  },
  resolve(...parts) {
    let current = '';
    for (const part of parts) {
      if (part === '') continue;
      current = isAbsolute(part) ? part : current ? `${current}/${part}` : `/${part}`;
    }
    return normalize(current || '/') as t.StringAbsolutePath;
  },
  relative(from, to) {
    const fromParts = split(POSIX_PATH.resolve(from));
    const toParts = split(POSIX_PATH.resolve(to));
    let index = 0;
    while (
      index < fromParts.length && index < toParts.length && fromParts[index] === toParts[index]
    ) {
      index++;
    }
    const up = fromParts.slice(index).map(() => '..');
    const down = toParts.slice(index);
    return [...up, ...down].join('/') as t.StringRelativePath;
  },
  normalize,
});

function isAbsolute(input: t.StringPath): boolean {
  return input.startsWith('/') || WINDOWS_DRIVE.test(input);
}

function normalize(input: t.StringPath): t.StringPath {
  const absolute = isAbsolute(input);
  const segments: string[] = [];

  for (const segment of input.replaceAll('\\', '/').split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (segments.length > 0 && segments[segments.length - 1] !== '..') segments.pop();
      else if (!absolute) segments.push('..');
    } else {
      segments.push(segment);
    }
  }

  const output = segments.join('/');
  if (absolute) return `/${output}`;
  return output === '' ? '.' : output;
}

function split(input: t.StringPath): readonly string[] {
  return POSIX_PATH.resolve(input).split('/').filter(Boolean);
}
