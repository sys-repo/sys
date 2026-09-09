import { Is, Obj, Pkg, type t } from '../common.ts';

export type PkgIdentity = {
  readonly root: string;
  readonly subpath: string;
  readonly plain: string;
};

type ResolvedPackageInput = {
  readonly pkg: t.Pkg;
  readonly subpath?: unknown;
};

type PkgIdentityPair = {
  readonly full: PkgIdentity;
  readonly compact: PkgIdentity;
};

export function resolvePackageInput(
  input?: t.CliFormatHeader.PackageIdentity,
): ResolvedPackageInput | undefined {
  if (Is.object(input) && Obj.hasOwn(input, 'root')) {
    const root = input.root;
    if (!Pkg.Is.pkg(root)) return;
    return {
      pkg: root,
      ...(Obj.hasOwn(input, 'subpath') ? { subpath: input.subpath } : {}),
    };
  }
  return Pkg.Is.pkg(input) ? { pkg: input } : undefined;
}

export function resolvePkgIdentity(name: string, subpathInput?: unknown): PkgIdentityPair {
  const parsed = splitPkgName(name);
  const subpath = joinPkgSubpath(parsed.subpath, subpathInput);
  return {
    full: createPkgIdentity(parsed.root, subpath),
    compact: createPkgIdentity(compactPkgRoot(parsed.root), subpath),
  };
}

function splitPkgName(name: string): { root: string; subpath: string } {
  const firstSlash = name.indexOf('/');
  if (firstSlash < 0 || !name.startsWith('@')) return splitUnscopedPkgName(name, firstSlash);

  const subpathAt = name.indexOf('/', firstSlash + 1);
  if (subpathAt < 0) return { root: name, subpath: '' };
  return { root: name.slice(0, subpathAt), subpath: name.slice(subpathAt + 1) };
}

function splitUnscopedPkgName(name: string, firstSlash: number): { root: string; subpath: string } {
  if (firstSlash < 0) return { root: name, subpath: '' };
  return { root: name.slice(0, firstSlash), subpath: name.slice(firstSlash + 1) };
}

function compactPkgRoot(root: string): string {
  const firstSlash = root.indexOf('/');
  if (!root.startsWith('@') || firstSlash < 0) return root;
  return root.slice(firstSlash + 1) || root;
}

function createPkgIdentity(root: string, subpath: string): PkgIdentity {
  const suffix = subpath ? `/${subpath}` : '';
  return { root, subpath: suffix, plain: `${root}${suffix}` };
}

function joinPkgSubpath(...parts: readonly unknown[]): string {
  const values: string[] = [];
  for (const part of parts) {
    const parsed = Pkg.Subpath.parse(part);
    if (parsed.kind === 'valid') values.push(parsed.value);
  }
  return values.join('/');
}
