import {
  type t,
  c,
  Cli,
  Date as D,
  Fs,
  HashFmt,
  Path,
  PATHS,
  pkg,
  Pkg,
  Str,
  ViteLog,
} from './common.ts';

/**
 * Console logging operations for the module.
 */
export const VitepressLog = {
  API: ViteLog.API,

  Build: {
    log: (args: t.ViteLogBundleArgs) => console.info(VitepressLog.Build.toString(args)),
    toString: (args: t.ViteLogBundleArgs) => ViteLog.Bundle.toString(args),
  },
  Dev: {
    log: (args: t.ViteLogDevArgs) => console.info(VitepressLog.Dev.toString(args)),
    toString: (args: t.ViteLogDevArgs) => {
      const { pkg } = args;
      const inDir = wrangle.formatPath(args.inDir);
      const table = Cli.table([]);
      if (pkg) {
        const module = c.gray(`${c.white(pkg.name)}${c.dim('@')}${pkg.version}`);
        table.push([c.gray('module'), module]);
      }
      table.push([c.green(`input:`), c.gray(inDir)]);
      return table.toString();
    },
  },

  /**
   * Display the help output.
   */
  async help(args: { dir?: t.StringDir; minimal?: boolean } = {}) {
    const { dir = PATHS.inDir, minimal = false } = args;
    VitepressLog.API.log({ minimal });
    console.info();

    const { dist } = await Pkg.Dist.load(Fs.resolve(dir, PATHS.dist));
    if (dist) {
      ViteLog.Dist.log(dist, { dirs: { in: dir } });
    } else {
      const buildCmd = c.green(`deno task ${c.bold('build')}`);
      const notBuilt = c.italic(c.yellow('(not yet built)'));
      console.info(c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
      console.info(c.gray(`${notBuilt} → run:`));
      console.info(c.gray(`                      ${buildCmd}`));
    }

    console.info();
  },

  Snapshot: {
    async log(snapshot: t.DirSnapshot) {
      const text = await VitepressLog.Snapshot.toString(snapshot);
      console.info(text);
      return text;
    },

    async toString(snapshot: t.DirSnapshot) {
      const target = snapshot.path.target.root;
      const size = await Fs.Size.dir(Path.resolve(target));

      const backupsDir = Fs.dirname(target);
      const backups = (await Fs.glob(backupsDir).find('*', {}))
        .filter((e) => e.isDirectory)
        .map((e) => e.path);

      const snapshotsPlural = Str.plural(backups.length, 'snapshot', 'snapshots');
      let total = `${size.total.files.toLocaleString()} files `;
      total += c.gray(`in latest of ${backups.length} ${snapshotsPlural}`);

      const title = c.green(c.bold('Snapshot'));
      const titleSize = c.brightGreen(Str.bytes(size.total.bytes));

      const table = Cli.table([title, titleSize]);
      const push = (label: string, value: string | number) => table.push([c.gray(label), value]);
      const formatPath = (path: t.StringPath) => `./${Path.trimCwd(path)}`;

      const date = new Date(snapshot.timestamp);
      const dateFmt = D.format(date, 'd MMM yyyy');

      const distJson = await Pkg.Dist.compute(snapshot.path.target.files);
      const digest = distJson.dist?.hash.digest;
      const targetRight = `${c.white(dateFmt)} | ${HashFmt.digest(digest, { algo: false })}`;

      push('  source', c.gray(formatPath(snapshot.path.source)));
      push('  target', c.gray(`${formatPath(snapshot.path.target.root)} | ${targetRight}`));
      push('  total', total.toLocaleString());

      return table.toString().trim();
    },
  },
};

/**
 * Helpers
 */
const wrangle = {
  formatPath(input: string = ''): string {
    return input ? input : `./`;
  },
} as const;
