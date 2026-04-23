import { Path } from './common.ts';

export function isDenoSpecifier(str: string) {
  return str.startsWith('\0deno');
}

export function toDenoSpecifier(loader: string, id: string, resolved: string) {
  return `\0deno::${loader}::${id}::${resolved}`;
}

export function parseDenoSpecifier(spec: string) {
  const [_, loader, id, posixPath] = spec.split('::');
  return {
    loader,
    id,
    resolved: Path.normalize(posixPath),
  };
}

export function unwrapViteId(id: string) {
  return id.startsWith('/@id/') ? id.slice('/@id/'.length).replace('__x00__', '\0') : id;
}

export function canonicalRemoteSpecifier(value: string) {
  if (value.startsWith('jsr:')) return value;
  if (!/^(https?:\/\/|https?:\/)/i.test(value)) return value;

  const repaired = value.replace(/^(https?):\/(?!\/)/i, '$1://');
  const url = new URL(repaired);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}
