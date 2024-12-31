import { type t, c, Cli, pkg } from './common.ts';

type Cmd = t.CmdArgsMain['cmd'];

/**
 * Console logging operations for the module.
 */
export const Log = {
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
  help() {
    Log.usageAPI();
    console.info(c.gray(`${c.white(pkg.name)} ${c.green(pkg.version)}`));
  },
};
