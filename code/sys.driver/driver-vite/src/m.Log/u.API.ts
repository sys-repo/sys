import { type t, c, Cli } from './common.ts';

type C = (str: string) => string;

export const API: t.ViteLogApi = {
  log(args = {}) {
    const { cmd, minimal = true, disabled = [] } = args;
    const table = Cli.table([]);

    let footnote = '';

    const cmdColor = (cmd: t.ViteLogApiCmd): C => {
      const isDisabled = disabled.includes(cmd);
      const done = (fmt: C): C => (!isDisabled ? fmt : (str) => c.strikethrough(c.dim(fmt(str))));
      return done(cmd === args.cmd || !args.cmd ? c.green : c.gray);
    };

    const descriptionColor = (cmd: string) => {
      if (!args.cmd) return c.white;
      return cmd === args.cmd ? c.white : c.gray;
    };

    const push = (cmd: t.ViteLogApiCmd, description: string) => {
      const isDisabled = disabled.includes(cmd);
      let name = cmdColor(cmd)(`${cmd}`);
      if (args.cmd === cmd) name = c.bold(name);
      let left = c.gray(`  deno task ${name}`);
      const right = descriptionColor(cmd)(description);

      if (isDisabled) {
        left += c.yellow('*');
        footnote = c.yellow(`\n* TODO 🐷 ${c.italic('(implemention in progress)')}`);
      }

      table.push([left, right]);
    };

    push('dev', 'Run the development server.');
    push('build', 'Transpile to production bundle.');
    push('serve', 'Run a local HTTP server over the production bundle.');
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
    if (footnote) console.info(footnote);
  },
};
