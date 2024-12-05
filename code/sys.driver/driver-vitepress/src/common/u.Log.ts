import { c, Cli, Fs } from './libs.ts';
import type * as t from './t.ts';

export const Log = {
  usageAPI() {
    const table = Cli.table([]);
    const push = (cmd: string, description: string) => {
      const left = c.gray(`  deno task ${c.green(cmd)}`);
      table.push([left, description]);
    };
    push('dev', 'Run the development server.');
    push('build', 'Transpile the production bundle.');
    push('serve', 'Run a local HTTP server for the production bundle.');
    push('upgrade', `Upgrade to latest version.`);
    push('help', `Show help.`);

    console.info(c.gray(`Usage: ${c.green('deno task [COMMAND]')}`));
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
