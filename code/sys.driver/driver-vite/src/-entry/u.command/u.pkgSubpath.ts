import { Pkg } from '@sys/std/pkg';

type PackageSubpathInput = {
  pkgSubpath?: unknown;
  'pkg-subpath'?: unknown;
};

/** Reconcile programmatic and CLI package-subpath inputs through the canonical parser. */
export function resolvePkgSubpath(input: PackageSubpathInput): string | undefined {
  const camel = Pkg.Subpath.parse(input.pkgSubpath);
  const kebab = Pkg.Subpath.parse(input['pkg-subpath']);
  if (camel.kind === 'invalid') throw new Error('ViteEntry: invalid pkgSubpath.');
  if (kebab.kind === 'invalid') throw new Error('ViteEntry: invalid pkg-subpath.');
  if (camel.kind === 'valid' && kebab.kind === 'valid' && camel.value !== kebab.value) {
    throw new Error('ViteEntry: pkgSubpath and pkg-subpath conflict.');
  }
  if (camel.kind === 'valid') return camel.value;
  if (kebab.kind === 'valid') return kebab.value;
}
