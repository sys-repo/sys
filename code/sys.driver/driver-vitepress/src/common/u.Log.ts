import { pkg } from '../pkg.ts';
import { c, Cli } from './libs.ts';

export const Log = {
  commandAPI() {
    const table = Cli.table([]);
    const push = (cmd: string, description: string) => {
      const left = c.gray(`  deno task ${c.green(cmd)}`);
      table.push([left, description]);
    };
    push('dev', 'Run the development server.');
    push('build', 'Transpile the production bundle.');
    push('serve', 'Run a local HTTP server on the production bundle.');
    push('upgrade', `Upgrade to latest version`);

    console.info(c.gray(`Usage: ${c.green('deno task [COMMAND]')}`));
    table.render();
    console.info(``);
  },
};
