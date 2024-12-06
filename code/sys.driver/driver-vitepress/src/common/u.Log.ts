import { c, Cli, Fs } from './libs.ts';
import type * as t from './t.ts';

export const Log = {
  usageAPI(args: { cmd?: t.CmdArgsMain['cmd'] } = {}) {
    const { cmd } = args;
    const table = Cli.table([]);
    const cmdColor = (cmd: string) => {
      if (!args.cmd) return c.green;
      return cmd === args.cmd ? c.green : c.gray;
    };

    const push = (cmd: string, description: string) => {
      const color = cmdColor(cmd);
      let name = color(cmd);
      if (args.cmd === cmd) name = c.bold(name);
      const left = c.gray(`  deno task ${name}`);
      table.push([left, description]);
    };
    push('dev', 'Run the development server.');
    push('build', 'Transpile the production bundle.');
    push('serve', 'Run a local HTTP server with the production bundle.');
    push('upgrade', `Upgrade to latest version.`);
    push('help', `Show help.`);

    const COMMAND = `[${c.bold('COMMAND')}]`;
    console.info(c.gray(`Usage: ${c.green(`deno task ${cmd ? c.bold(cmd) : COMMAND}`)}`));
    table.render();
    console.info(``);
  },

  filesTable(files: t.VitePressFileUpdate[]) {
    type K = t.VitePressFileUpdate['kind'];
    const table = Cli.table([c.gray('Scaffold:'), '']);
    for (const item of files) {
      const isUserfile = item.kind === 'Userspace';
      let path = Fs.Path.trimCwd(item.path);
      path = isUserfile ? c.dim(c.gray(path)) : path;

      let k = item.kind;
      if (k === 'Created') k = c.green(k) as K;
      if (k === 'Updated') k = c.yellow(k) as K;
      if (k === 'Unchanged') k = c.gray(k) as K;
      if (k === 'Userspace') k = c.gray(k) as K;

      const suffix = isUserfile ? '(ignored)' : '';
      table.push([`  ${k}`, c.white(path), suffix]);
    }
    return table;
  },
};
