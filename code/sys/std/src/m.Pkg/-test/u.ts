import { type t } from '../../-test.ts';

/**
 * Local helpers to narrow the PkgDistLocation union in a type-safe way.
 */
export function isUrl(loc: t.PkgDistLocation): loc is t.PkgDistLocationUrl {
  return loc.kind === 'url';
}

export function isDir(loc: t.PkgDistLocation): loc is t.PkgDistLocationDir {
  return loc.kind === 'dir';
}

export function expectUrl(loc: t.PkgDistLocation): t.PkgDistLocationUrl {
  if (!isUrl(loc)) {
    throw 'expected PkgDistLocationUrl (kind: "url")';
  }
  return loc;
}

export function expectDir(loc: t.PkgDistLocation): t.PkgDistLocationDir {
  if (!isDir(loc)) {
    throw 'expected PkgDistLocationDir (kind: "dir")';
  }
  return loc;
}
