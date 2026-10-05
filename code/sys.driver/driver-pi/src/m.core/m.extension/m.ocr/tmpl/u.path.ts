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

export function relativePath(from: string, to: string) {
  const fromSegments = pathSegments(normalizePath(from));
  const toSegments = pathSegments(normalizePath(to));
  let shared = 0;
  while (shared < fromSegments.length && fromSegments[shared] === toSegments[shared]) shared += 1;
  const up = Array.from({ length: fromSegments.length - shared }, () => '..');
  return [...up, ...toSegments.slice(shared)].join('/');
}

export function isAbsolutePath(path: string) {
  return path.startsWith('/') || path.startsWith('\\\\') || windowsDrive(path) !== undefined;
}

export function hasParentSegment(path: string) {
  return path.split(/[\\/]+/).some((segment) => segment === '..');
}

export function hasGlobChars(path: string) {
  return /[*?\[\]{}]/.test(path);
}

function normalizePath(input: string) {
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

function pathSegments(path: string) {
  const normalized = normalizePath(path);
  const drive = windowsDrive(normalized);
  const rest = drive ? normalized.slice(drive.length + 1) : normalized;
  return rest.split('/').filter((segment) => segment.length > 0);
}

function windowsDrive(path: string) {
  const match = /^[A-Za-z]:/.exec(path);
  return match?.[0];
}
