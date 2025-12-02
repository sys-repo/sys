import { type t, Is, isHttpUrl } from './common.ts';

/**
 * Implementation of [Pkg.Dist.location].
 */
export const location: t.PkgDistLocationFn = (
  input: URL | t.HttpUrl | t.StringUrl | t.StringDir | t.StringPath,
): t.PkgDistLocation => {
  return input instanceof URL || isHttpUrl(input) || Is.urlString(input)
    ? fromUrl(input)
    : fromDir(input);
};

/**
 * Internal: URL → PkgDistLocationUrl
 */
function fromUrl(input: URL | t.StringUrl | t.HttpUrl): t.PkgDistLocationUrl {
  const url = input instanceof URL ? input : isHttpUrl(input) ? input.toURL() : new URL(input);

  const { protocol, host } = url;
  const pathname = url.pathname || '/';
  const root = pathname === '/' ? '/' : pathname.replace(/\/[^/]*$/, '') || '/';
  const segments = root === '/' ? [] : root.replace(/^\//, '').split('/');

  return {
    kind: 'url',
    href: url.href as t.StringUrl,
    origin: `${protocol}//${host}`,
    host,
    protocol,
    pathname,
    root,
    segments,
    is: { root: root === '/' },
  };
}

/**
 * Internal: Dir/path → PkgDistLocationDir
 */
function fromDir(input: t.StringDir | t.StringPath): t.PkgDistLocationDir {
  const text = String(input).trim();
  let dir = text === '' ? '/' : text;
  if (!dir.startsWith('/')) dir = `/${dir}`;

  const root = dir as t.StringPath;
  const segments = root === '/' ? [] : root.replace(/^\//, '').split('/');

  return {
    kind: 'dir',
    dir,
    root,
    segments,
    is: { root: root === '/' },
  };
}
