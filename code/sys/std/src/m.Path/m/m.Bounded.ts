import { Is, type t } from '../common.ts';

const WINDOWS_DRIVE = /^[a-zA-Z]:/;

const defaultInvalid: t.PathBounded.Invalid = (message) => new Error(message);

/** String-only helpers for bounded, root-relative, POSIX-visible resource paths. */
export const Bounded: t.PathBounded.Lib = Object.freeze({
  Is: Object.freeze({
    windowsDrive(input: t.StringPath) {
      return WINDOWS_DRIVE.test(input);
    },
  }),

  visible(ops: t.PathBounded.Ops, input: unknown, invalid = defaultInvalid) {
    if (input === undefined || input === '' || input === '.') return '';
    if (!Is.string(input)) throw invalid('Path must be a string');
    if (input.includes('\0')) throw invalid('Path contains NUL');
    if (input.includes('\\')) throw invalid('Path must use POSIX separators');
    if (ops.isAbsolute(input) || Bounded.Is.windowsDrive(input)) {
      throw invalid('Path must be root-relative');
    }
    if (input.split('/').includes('..')) {
      throw invalid('Path cannot traverse above root');
    }

    const normalized = ops.normalize(input).replaceAll('\\', '/');
    if (normalized.includes('\0')) throw invalid('Path contains NUL');

    const path = normalized === '.' ? '' : normalized.replace(/^\.\/+/, '');
    if (path.split('/').includes('..')) {
      throw invalid('Path cannot traverse above root');
    }
    if (path.startsWith('/') || Bounded.Is.windowsDrive(path)) {
      throw invalid('Path must be root-relative');
    }
    return path;
  },

  parent(input: t.StringRelativePath, invalid = defaultInvalid) {
    const path = Bounded.visible(POSIX_PATH, input, invalid);
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return parts.join('/') as t.StringRelativePath;
  },

  posix() {
    return POSIX_PATH;
  },
});

const POSIX_PATH: t.PathBounded.PosixOps = Object.freeze({
  isAbsolute,
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
