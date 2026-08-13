import type { ViteEntry } from '@sys/driver-vite/t';
import { Args } from '@sys/std/args';
import { Pkg } from '@sys/std/pkg';

const PKG_SUBPATH_FLAGS = ['pkgSubpath', 'pkg-subpath'] as const;

/** The Driver Pi application surface rendered by its Vite commands. */
export const PKG_SUBPATH = 'ui';

type ViteMain = Pick<ViteEntry.Lib, 'main'>;
type ParsedArgs = ViteEntry.Args & Record<string, unknown>;

export async function main(input: string[]): Promise<void> {
  const { ViteEntry } = await import('@sys/driver-vite/entry');
  await mainWith(input, ViteEntry);
}

/** Internal delegation seam for deterministic task-adapter tests. */
export async function mainWith(input: string[], deps: ViteMain): Promise<void> {
  const args = Args.parse<ParsedArgs>(input, { string: [...PKG_SUBPATH_FLAGS] });
  await deps.main(withPkgSubpath(args));
}

function withPkgSubpath(args: ParsedArgs): ParsedArgs {
  if (args.cmd !== 'dev' && args.cmd !== 'serve') return args;

  const camel = parsePkgSubpath('pkgSubpath', args.pkgSubpath);
  const kebab = parsePkgSubpath('pkg-subpath', args['pkg-subpath']);
  if (camel && kebab && camel !== kebab) {
    throw new Error('DriverPiVite: pkgSubpath and pkg-subpath conflict.');
  }
  const resolved = camel ?? kebab;
  if (resolved && resolved !== PKG_SUBPATH) {
    throw new Error('DriverPiVite: package subpath conflicts with the package-owned identity.');
  }

  if (resolved) return args;
  return { ...args, pkgSubpath: PKG_SUBPATH };
}

function parsePkgSubpath(name: 'pkgSubpath' | 'pkg-subpath', input: unknown): string | undefined {
  const value = Pkg.Subpath.parse(input);
  if (value.kind === 'invalid') throw new Error(`DriverPiVite: invalid ${name}.`);
  return value.kind === 'valid' ? value.value : undefined;
}
