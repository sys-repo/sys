import type { FileInfo } from './t.ts';

export const Fs = {
  resolve: resolvePath,
  dirname,
  lstat,
  remove: removePath,
  rename: Deno.rename,
  copyFile: Deno.copyFile,
  Path: {
    relative,
    Is: { absolute: isAbsolutePath },
  },
} as const;

export function resolvePath(...parts: readonly string[]) {
  let path = '';
  for (const part of parts) {
    if (!part) continue;
    if (isAbsolutePath(part)) path = part;
    else path = path ? `${path}/${part}` : part;
  }
  if (!path) path = '.';
  if (!isAbsolutePath(path)) path = `${Deno.cwd()}/${path}`;
  return normalizePath(path);
}

export function normalizePath(input: string) {
  const path = input.replaceAll('\\', '/');
  const absolute = isAbsolutePath(path);
  const drive = absolute ? windowsDrive(path) : undefined;
  const prefix = drive ? `${drive}/` : absolute ? '/' : '';
  const rest = drive ? path.slice(drive.length + 1) : absolute ? path.slice(1) : path;
  const output: string[] = [];

  for (const segment of rest.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (output.length > 0 && output.at(-1) !== '..') output.pop();
      else if (!absolute) output.push(segment);
      continue;
    }
    output.push(segment);
  }

  const normalized = `${prefix}${output.join('/')}`;
  if (normalized) return normalized;
  return absolute ? prefix || '/' : '.';
}

export function dirname(input: string) {
  const path = normalizePath(input);
  const drive = windowsDrive(path);
  const root = drive ? `${drive}/` : '/';
  const trimmed = path.length > root.length ? path.replace(/\/+$/, '') : path;
  const index = trimmed.lastIndexOf('/');
  if (index < 0) return '.';
  if (index === 0) return '/';
  if (drive && index === drive.length) return root;
  return trimmed.slice(0, index);
}

export function relative(from: string, to: string) {
  const fromSegments = pathSegments(normalizePath(from));
  const toSegments = pathSegments(normalizePath(to));
  let shared = 0;
  while (shared < fromSegments.length && fromSegments[shared] === toSegments[shared]) shared += 1;
  const up = Array.from({ length: fromSegments.length - shared }, () => '..');
  return [...up, ...toSegments.slice(shared)].join('/');
}

export async function lstat(path: string): Promise<FileInfo | undefined> {
  try {
    return await Deno.lstat(path);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

export async function removePath(path: string, options: { readonly recursive?: boolean } = {}) {
  await Deno.remove(path, { recursive: options.recursive === true });
}

export function pathSegments(path: string) {
  const normalized = normalizePath(path);
  const drive = windowsDrive(normalized);
  const rest = drive ? normalized.slice(drive.length + 1) : normalized;
  return rest.split('/').filter((segment) => segment.length > 0);
}

export function isAbsolutePath(path: string) {
  return path.startsWith('/') || path.startsWith('\\\\') || windowsDrive(path) !== undefined;
}

export function windowsDrive(path: string) {
  const match = /^[A-Za-z]:/.exec(path);
  return match?.[0];
}

export function isNotFound(error: unknown) {
  return error instanceof Deno.errors.NotFound ||
    (error instanceof Error && error.name === 'NotFound');
}
