import { Perf } from '../../common/u.perf.ts';
import { DEFAULTS, Net, Path, Pkg, type t } from '../common.ts';
import { Wrangle } from '../u/u.wrangle.ts';

/** Validate package identity before acquiring paths, ports, or command resources. */
export function packageIdentity(
  input: t.Vite.Dev.Args,
): t.Cli.Fmt.Header.PackageIdentity | undefined {
  const subpath = Pkg.Subpath.parse(input.pkgSubpath);
  if (subpath.kind === 'invalid') throw new Error('Vite.dev: invalid package subpath.');
  if (subpath.kind !== 'valid') return input.pkg;
  if (!input.pkg) throw new Error('Vite.dev: package subpath requires package metadata.');
  return { root: input.pkg, subpath: subpath.value };
}

/** Resolve startup policy and paths without acquiring child-command resources. */
export async function prepareStartup(input: t.Vite.Dev.Args, deps: t.ViteDevDeps) {
  const loadDist = deps.loadDist ?? Pkg.Dist.load;
  const strictPort = input.strictPort ?? false;
  const paths = input.paths ?? await Perf.measure(
    'dev.parent.paths',
    async () => await Wrangle.pathsFromConfigfile(input.cwd),
    { cwd: input.cwd ?? '' },
    { level: 2 },
  );
  const { cwd } = paths;
  const preferredPort = input.port ?? DEFAULTS.port;
  let requestedPort: number;
  try {
    requestedPort = strictPort ? Net.port(preferredPort, { throw: true }) : Net.port(preferredPort);
  } catch (cause) {
    throw startupError({ cwd, requestedPort: preferredPort, strictPort, cause });
  }
  const manifestPath = Path.resolve(cwd, paths.app.outDir, 'dist.json');
  const { dist } = await Perf.measure(
    'dev.parent.dist',
    async () => await loadDist(manifestPath),
    { cwd },
    { level: 2 },
  );
  const flags = `dev --port=${requestedPort} --host${strictPort ? ' --strictPort' : ''}`;
  return { paths, dist, requestedPort, strictPort, flags };
}

export function startupError(args: {
  cwd: t.StringDir;
  requestedPort: number;
  strictPort: boolean;
  output?: t.ViteDev.Output.Log;
  cause: unknown;
}) {
  const { cwd, requestedPort, strictPort, cause, output } = args;
  const stderr = output?.stderr().trim() ?? '';
  const tail = output?.tailText().trimEnd() ?? '';
  const mode = strictPort ? ' strict' : '';
  const message = [
    `Vite.dev: failed to start${mode} dev server on port ${requestedPort}.`,
    `cwd: ${cwd}`,
    stderr ? `stderr:\n${stderr}` : '',
    tail ? `recent output:\n${tail}` : '',
  ].filter(Boolean).join('\n\n');
  return new Error(message, { cause });
}
