import type { ViteEntry } from '@sys/driver-vite/t';
import { Args } from '@sys/std/args';
import { Pkg } from '@sys/std/pkg';
import { pkg } from '../src/pkg.ts';
import { c, Cli, DistServer, Is, Str } from './common.ts';

const PKG_SUBPATH_FLAGS = ['pkgSubpath', 'pkg-subpath'] as const;

/** The Driver Pi application surface rendered by its Vite commands. */
export const PKG_SUBPATH = 'ui';

type ViteMain = Pick<ViteEntry.Lib, 'main'>;
type ParsedArgs = ViteEntry.Args & Record<string, unknown>;

export async function main(input: string[]): Promise<void> {
  const { ViteEntry } = await import('@sys/driver-vite/entry');
  try {
    await mainWith(input, ViteEntry);
  } catch (cause) {
    if (!reportServeInUse(input, cause)) throw cause;
    Deno.exitCode = 1;
  }
}

export type ServeInUseOptions = Readonly<{
  port?: number;
  task?: string;
  width?: number;
}>;

/** Render one stable fixed-listener refusal without exposing a native stack. */
export function renderServeInUse(options: ServeInUseOptions = {}): string {
  const { port = 8080, task = 'deno task serve', width } = options;
  const table = Cli.Table.create();
  const packageIdentity = `${c.white(pkg.name)}${c.gray(`@${pkg.version}`)}`;
  table.push([c.gray('package'), packageIdentity]);
  table.push([c.gray('service'), c.white('local dist server')]);
  table.push([c.gray('listener'), c.white(`127.0.0.1:${port}`)]);
  table.push([c.gray('state'), `${c.yellow('IN USE')}${c.gray(' (not started)')}`]);
  table.push([c.gray('retry'), c.cyan(task)]);

  const tableText = String(table).split('\n').map((line) => line.trimEnd()).join('\n');
  const rule = width === undefined ? Cli.Fmt.hr('yellow') : Cli.Fmt.hr({ width, color: 'yellow' });
  return Str.dedent(`${tableText}

${rule}`);
}

/** Internal delegation seam for deterministic task-adapter tests. */
export async function mainWith(input: string[], deps: ViteMain): Promise<void> {
  const args = Args.parse<ParsedArgs>(input, { string: [...PKG_SUBPATH_FLAGS] });
  await deps.main(withPkgSubpath(args));
}

function reportServeInUse(input: string[], cause: unknown): boolean {
  if (!DistServer.Error.is(cause) || cause.reason !== 'address-in-use') return false;

  const args = Args.parse<ParsedArgs>(input, { string: [...PKG_SUBPATH_FLAGS] });
  if (args.cmd !== 'serve') return false;
  const port = Is.number(args.port) && args.port >= 1 && args.port <= 65_535 ? args.port : 8080;
  Cli.Screen.repaint(renderServeInUse({ port }));
  return true;
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
