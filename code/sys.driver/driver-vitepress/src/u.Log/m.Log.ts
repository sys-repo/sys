import { type t, c, Cli, Fs, Path, PATHS, pkg, Pkg, Str, ViteLog } from './common.ts';

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
  usageAPI(args: { cmd?: Cmd } = {}) {
    const { cmd } = args;
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
    push('build', 'Transpile the production bundle.');
    push('serve', 'Run a local HTTP server with the production bundle.');
    push('upgrade', `Upgrade to latest version.`);
    push('backup', `Make a snapshot backup of the project.`);
    push('help', `Show help.`);

    const COMMAND = `[${c.bold('COMMAND')}]`;
    console.info(c.gray(`Usage: ${c.green(`deno task ${cmd ? c.bold(cmd) : COMMAND}`)}`));
    table.render();
    console.info(``);
  },

  /**
   * Display the help output.
   */
  async help(args: { inDir?: t.StringDir } = {}) {
    const { inDir = PATHS.inDir } = args;
    Log.usageAPI();

    const { dist } = await Pkg.Dist.load(Fs.resolve(inDir, 'dist'));
    if (dist) {
      Log.dist(dist, { inDir });
    } else {
      const buildCmd = c.green(`deno task ${c.bold('build')}`);
      const buildOutput = `dist/*`;
      console.info(c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
      console.info(c.gray(`${c.italic(`(not yet built)`)} → run ${buildCmd} → ${buildOutput}`));
    }

    console.info();
  },

  /**
   * Log a table of a distribution package info.
   */
  dist(dist: t.DistPkg, options: { inDir?: t.StringDir } = {}) {
    const { inDir = PATHS.inDir } = options;

    const title = c.green(c.bold('Bundle'));
    const size = c.brightGreen(Str.bytes(dist.size.bytes));
    const digest = ViteLog.digest(dist.hash.digest);
    const distPath = Path.trimCwd(Path.join(inDir, 'dist/dist.json'));
    const distPathCols = `${Path.dirname(distPath)}/${c.cyan(Path.basename(distPath))}`;

    const table = Cli.table([title, size]);
    const push = (label: string, value: string) => table.push([c.gray(label), value]);

    push('dist:', c.gray(`${distPathCols} ${digest}`));
    push('pkg:', c.gray(`${c.white(c.bold(pkg.name))} ${pkg.version}`));
    console.info(table.toString().trim());
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
