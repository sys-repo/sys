import {
  type t,
  CompositeHash,
  c,
  Cli,
  Fs,
  Pkg,
  Process,
  Time,
  FileHashUri,
  Hash,
} from './common.ts';
import { Log, Wrangle } from './u.ts';

type B = t.ViteLib['build'];

/**
 * Run the <vite:build> command.
 */
export const build: B = async (input) => {
  const timer = Time.timer();
  const paths = await Wrangle.pathsFromConfigfile(input.cwd);

  const { pkg, silent = false } = input;
  const { cmd, args } = await Wrangle.command(paths, 'build');
  const dir = Fs.join(paths.cwd, paths.app.outDir);
  const cwd = paths.cwd;

  const clean = async (dir: t.StringPath) => {
    const remove = async (pattern: string) => {
      const paths = await Fs.glob(dir).find(pattern);
      for (const p of paths) await Fs.remove(p.path, { log: false });
    };
    await remove('**/.DS_Store');
  };

  if (!silent) {
    const table = Cli.table([]);
    const push = (label: string, ...value: string[]) => table.push([c.gray(label), ...value]);
    push('Directory:', c.gray(`${cwd.replace(/\/$/, '')}/`));
    push('  - entry:', paths.app.entry);
    push('  - outDir:', paths.app.outDir);
    push('  - base:', paths.app.base);

    console.info(c.bold(c.brightGreen('Paths')));
    console.info(table.toString().trim());
    console.info();
  }

  const spinner = Cli.Spinner.create('building', { silent, start: false });
  if ((input.spinner ?? true) && !silent) spinner.start();

  const output = await Process.invoke({ cwd, args, silent: true });
  const ok = output.success;

  if (pkg) {
    const path = Fs.join(dir, 'pkg', '-pkg.json');
    await Fs.ensureDir(Fs.dirname(path));
    await Deno.writeTextFile(path, JSON.stringify(pkg, null, '  '));
  }

  await clean(paths.app.outDir);

  const entry = await wrangle.entryPath(dir);
  const dist = (await Pkg.Dist.compute({ dir, pkg, entry, save: true })).dist;
  const hash = dist.hash.digest;
  const elapsed = timer.elapsed.msec;

  const res: t.ViteBuildResponse = {
    ok,
    paths,
    elapsed,
    get dist() {
      return dist;
    },
    get cmd() {
      return { input: cmd, output };
    },
    toString(options = {}) {
      const { pad } = options;
      const stdio = output.toString();
      return Log.Build.toString({
        ok,
        stdio,
        dirs: { in: paths.app.entry, out: paths.app.outDir },
        totalSize: dist.size.total,
        pkg,
        pkgSize: CompositeHash.size(dist.hash.parts, (e) => e.path.startsWith('pkg/')),
        hash,
        pad,
        elapsed,
      });
    },
  };

  spinner.stop();
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async entryPath(dist: t.StringDir) {
    const paths = await Fs.glob(dist).find('pkg/-entry.*');
    const filename = paths[0]?.name ?? '';
    return filename ? `./pkg/${filename}` : '';
  },
} as const;
