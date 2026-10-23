import { Path, type t } from '../common.ts';

const LOCAL_LOADERS: readonly t.DenoLoader[] = ['JSX', 'JavaScript', 'Json', 'TSX', 'TypeScript'];

/**
 * Admit a local, unqueried transport identity for exact workspace-target comparison.
 * Remote requests can carry local cache paths: those are not workspace identities.
 * Validate before parsing; the general transport parser assumes a trusted producer.
 */
export function localPathFromDenoSpecifier(value: string): string | undefined {
  const spec = unwrapViteId(value);
  if (!spec.startsWith('\0deno::')) return;
  const fields = spec.split('::');
  if (fields.length !== 4) return;
  const [, loader, request, resolved] = fields;
  if (!LOCAL_LOADERS.some((item) => item === loader)) return;
  if (!request || !resolved || /[?#\0]/.test(request + resolved)) return;
  if (!Path.Is.absolute(resolved)) return;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(request);
  const isLocalFileUrl = /^file:\/\/(?:\/|localhost\/)/i.test(request);
  if (hasScheme && !Path.Is.absolute(request) && !isLocalFileUrl) return;
  return Path.normalize(resolved);
}

export function isDenoSpecifier(str: string) {
  return str.startsWith('\0deno');
}

export function toDenoSpecifier(loader: string, id: string, resolved: string) {
  return `\0deno::${loader}::${repairConcreteRemoteAuthorityDelimiter(id)}::${resolved}`;
}

export function parseDenoSpecifier(spec: string) {
  const [_, loader, id, resolvedPath] = spec.split('::');
  const resolved = isConcreteRemoteSpecifier(resolvedPath)
    ? canonicalRemoteSpecifier(resolvedPath)
    : Path.normalize(resolvedPath);
  return {
    loader,
    id: repairConcreteRemoteAuthorityDelimiter(id),
    resolved,
  };
}

export function unwrapViteId(id: string) {
  return id.startsWith('/@id/') ? id.slice('/@id/'.length).replace('__x00__', '\0') : id;
}

export function repairConcreteRemoteAuthorityDelimiter(value: string) {
  return value.replace(/^(https?):\/(?!\/)/i, '$1://');
}

export function canonicalRemoteSpecifier(value: string) {
  if (value.startsWith('jsr:')) return value;
  if (!/^(https?:\/\/|https?:\/)/i.test(value)) return value;

  const repaired = repairConcreteRemoteAuthorityDelimiter(value);
  const url = new URL(repaired);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

function isConcreteRemoteSpecifier(value: string) {
  return /^(https?:\/\/|https?:\/)/i.test(value);
}
