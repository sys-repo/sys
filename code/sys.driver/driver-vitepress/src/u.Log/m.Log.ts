import {
  type t,
  c,
  Cli,
  Date as D,
  Fs,
  Path,
  PATHS,
  pkg,
  Pkg,
  Str,
  ViteLog,
  HashFmt,
} from './common.ts';

type Cmd = t.CmdArgsMain['cmd'];

/**
 * Console logging operations for the module.
 */
export const Log = {
  Build: {
    log: (args: t.ViteLogBundleArgs) => console.info(Log.Build.toString(args)),
    toString: (args: t.ViteLogBundleArgs) => ViteLog.Bundle.toString(args),
  },
  Dev: {
    log: (args: t.ViteLogDevArgs) => console.info(Log.Dev.toString(args)),
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
   * Output the usage API (command/help).
   */
  usageAPI(args: { cmd?: Cmd; minimal?: boolean } = {}) {
    const { cmd, minimal = true } = args;
    const table = Cli.table([]);
    const cmdColor = (cmd: string) => {
      if (!args.cmd) return c.green;
      return cmd === args.cmd ? c.green : c.gray;
    };
    const descriptionColor = (cmd: string) => {
      if (!args.cmd) return c.white;
      return cmd === args.cmd ? c.white : c.gray;
    };

    const push = (cmd: string, description: string) => {
      const color = cmdColor(cmd);
      let name = color(cmd);
      if (args.cmd === cmd) name = c.bold(name);
      const left = c.gray(`  deno task ${name}`);
      const right = descriptionColor(cmd)(description);
      table.push([left, right]);
    };
    push('dev', 'Run the development server.');
    push('build', 'Transpile into production bundle.');
    push('serve', 'Run a local HTTP server with the production bundle.');
    if (!minimal) {
      table.push(['', '']);
      push('upgrade', `Upgrade to latest version.`);
      push('backup', `Take a snapshot of the project.`);
      push('clean', `Delete temporary files.`);
    }
    push('help', `Show help.`);

    const COMMAND = `[${c.bold('COMMAND')}]`;
    console.info(c.gray(`Usage: ${c.green(`deno task ${cmd ? c.bold(cmd) : COMMAND}`)}`));
    table.render();
    console.info(``);
  },

  /**
   * Display the help output.
   */
  async help(args: { inDir?: t.StringDir; minimal?: boolean } = {}) {
    const { inDir = PATHS.inDir, minimal = false } = args;
    Log.usageAPI({ minimal });

    const { dist } = await Pkg.Dist.load(Fs.resolve(inDir, PATHS.dist));
    if (dist) {
      Log.dist(dist, { inDir });
    } else {
      const buildCmd = c.green(`deno task ${c.bold('build')}`);
      const buildOutput = `dist/*`;
      const notBuilt = c.italic(c.yellow('(not yet built)'));
      console.info(c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
      console.info(c.gray(`${notBuilt} → run:`));
      console.info(c.gray(`                      ${buildCmd}`));
    }

    console.info();
  },

  /**
   * Log a table of a distribution package info.
   */
  dist(dist: t.DistPkg, options: { inDir?: t.StringDir } = {}) {
    const { inDir = PATHS.inDir } = options;

    const title = c.green(c.bold('Production Bundle'));
    const size = c.gray(`${Str.bytes(dist.size.bytes)}`);
    console.info(title);

    const digest = ViteLog.digest(dist.hash.digest);
    const distPath = Path.trimCwd(Path.join(inDir, 'dist/dist.json'));
    const distPathFmt = `${Path.dirname(distPath)}/${Path.basename(distPath)}`;
    const pkgNameFmt = c.white(c.bold(pkg.name));

    const table = Cli.table([]);
    const push = (label: string, value: string) => table.push([c.gray(label), value]);

    push('size:', size);
    push('dist:', c.gray(`${distPathFmt} ${digest}`));
    push('pkg:', c.gray(`https://jsr.io/${pkgNameFmt}@${pkg.version}`));

    console.info(table.toString().trim());
  },

  Snapshot: {
    async log(snapshot: t.DirSnapshot) {
      const text = await Log.Snapshot.toString(snapshot);
      console.info(text);
      return text;
    },

    async toString(snapshot: t.DirSnapshot) {
      const target = snapshot.path.target;
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

      const distJson = await Pkg.Dist.compute(snapshot.path.target);
      const digest = distJson.dist?.hash.digest;
      const targetRight = `${c.white(dateFmt)} | ${HashFmt.digest(digest, { algo: false })}`;

      push('  source', c.gray(formatPath(snapshot.path.source)));
      push('  target', c.gray(`${formatPath(snapshot.path.target)} | ${targetRight}`));
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
