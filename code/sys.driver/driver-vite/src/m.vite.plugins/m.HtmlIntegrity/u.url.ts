import { Path } from './common.ts';
import { integrityError } from './u.error.ts';

type Resource = { readonly fileName: string; readonly identity: string };

const DOCUMENT_ORIGIN = 'https://html-integrity.invalid';

/** Resolve only output-owned URLs. This is URL reasoning, never a filesystem read authority. */
export function integrityResource(
  input: string,
  htmlFile: string,
  base: string,
): Resource | undefined {
  const relativeBase = base === '' || base === './';
  const absoluteBase = /^https?:\/\//i.test(base);
  const mount = new URL(relativeBase ? '/' : base, DOCUMENT_ORIGIN);
  if (
    !mount.pathname.endsWith('/') || mount.search || mount.hash || mount.username || mount.password
  ) {
    throw integrityError(
      'expected a directory base without query, fragment, or credentials',
      { htmlFile, url: input },
    );
  }
  const document = new URL(htmlFile.split('/').map(encodeURIComponent).join('/'), mount);
  let url: URL;
  try {
    url = new URL(input, document);
  } catch {
    throw integrityError('invalid resource URL', { htmlFile, url: input });
  }

  // Absolute references in relative/root-base builds have no declared owned origin.
  const explicitOrigin = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(input);
  if (explicitOrigin && !absoluteBase) return undefined;
  if (url.origin !== mount.origin || !['http:', 'https:'].includes(url.protocol)) return undefined;

  const prefix = decodePath(mount.pathname, htmlFile, input);
  const path = input.split(/[?#]/)[0];
  const rootedPath = explicitOrigin ? path.replace(/^(?:https?:)?\/\/[^/\\]*/i, '') || '/' : path;
  // Exclude only definite outsiders, before inspecting unrelated path suffixes. Check both
  // spellings so URL normalization cannot hide a path originally inside the mount.
  if (
    rootedPath.startsWith('/') && outsideMount(rootedPath, prefix) &&
    outsideMount(url.pathname, prefix)
  ) return undefined;

  if (url.username || url.password) {
    throw integrityError('URL credentials are unsupported', { htmlFile, url: input });
  }
  if (input !== input.trim() || hasUnsafeCharacters(input)) {
    throw integrityError(
      'ambiguous whitespace or backslash in owned URL',
      { htmlFile, url: input },
    );
  }

  // Validate before URL normalization can erase encoded dot segments.
  const rawPath = decodePath(path, htmlFile, input);
  if (!explicitOrigin && !input.startsWith('/')) {
    const paths = Path.Bounded.posix();
    const local = paths.join(htmlFile, '..', rawPath);
    Path.Bounded.visible(
      paths,
      local,
      () => integrityError('path escapes output tree', { htmlFile, url: input }),
    );
  }
  const pathname = decodePath(url.pathname, htmlFile, input);
  if (!pathname.startsWith(prefix)) {
    if (!explicitOrigin && !input.startsWith('/')) {
      throw integrityError(`relative URL escapes output base ${prefix}`, { htmlFile, url: input });
    }
    return undefined;
  }
  const fileName = pathname.slice(prefix.length);
  if (!fileName) {
    throw integrityError('owned URL has no output filename', { htmlFile, url: input });
  }
  return { fileName, identity: url.href };
}

/** Compare only the mount segments; an ambiguous prefix must still reach owned-path validation. */
function outsideMount(pathname: string, prefix: string): boolean {
  const segments = pathname.split('/');
  for (const [index, expected] of prefix.slice(0, -1).split('/').entries()) {
    const segment = segments[index] ?? '';
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      // A literal mismatch can establish non-ownership even before a malformed escape.
      return !expected.startsWith(segment.split('%')[0]);
    }
    const head = decoded.split(/[/%\\]/)[0];
    if (!expected.startsWith(head)) return true;
    if (head !== decoded || hasUnsafeCharacters(decoded)) return false;
    if (decoded !== expected) return true;
  }
  return false;
}

/** Refuse ambiguous decoding rather than reinterpret a URL as an arbitrary disk path. */
function decodePath(path: string, htmlFile: string, original: string): string {
  if (/%(?:2f|5c|25|00)/i.test(path)) {
    throw integrityError(
      'encoded separator, percent, or NUL in owned path',
      { htmlFile, url: original },
    );
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    throw integrityError('malformed path encoding', { htmlFile, url: original });
  }
  if (hasUnsafeCharacters(decoded)) {
    throw integrityError('control character in owned path', { htmlFile, url: original });
  }
  for (const segment of path.split('/')) {
    if (!segment.includes('%')) continue;
    if (['.', '..'].includes(decodeURIComponent(segment))) {
      throw integrityError('encoded traversal in owned path', { htmlFile, url: original });
    }
  }
  return decoded;
}

/** Reject C0 controls, DEL, and backslash without relying on URL parser normalization. */
function hasUnsafeCharacters(text: string): boolean {
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f || char === '\\') return true;
  }
  return false;
}
