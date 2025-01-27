import { type t, c, Cli } from './common.ts';

export const UsageAPI: t.ViteLogUsageApi = {
  log(args = {}) {
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
    push('build', 'Transpile to production bundle.');
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
    console.info('');
    console.info(table.toString().trim());
  },
};
