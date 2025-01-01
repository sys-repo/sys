import { type t, Path, c } from './common.ts';
import { Paths } from './u.ts';
export * from './common.ts';

export type CmdResult = {
  output: t.CmdOutput;
  path: string;
};

/**
 * Logging helpers.
 */
export const Log = {
  /**
   * Log a set of results to the console.
   */
  output(results: CmdResult[], options: { title?: string; pad?: boolean } = {}) {
    const success = results.every(({ output }) => output.success);

    if (options.pad) console.log();
    const title = `${(options.title ?? 'Results').replace(/\:$/, '')}:`;
    console.info(title, success ? c.green('success') : c.red('failed'));

    const fmtBanner = (prefix: string, path: string) => {
      prefix = ` ${prefix.replace(/\:*$/, '')} `;
      prefix = c.bgYellow(c.white(prefix));
      return c.bold(`${c.red(prefix)} ${c.yellow(path)}`);
    };

    results
      .filter((item) => !item.output.success)
      .forEach((item) => {
        console.info(fmtBanner('↓ MODULE', item.path));
        console.info(item.output.text.stdout);
        console.info(fmtBanner('↑ MODULE', item.path));
        console.log('');
      });

    results.forEach((item) => {
      const ok = item.output.success;
      const status = ok ? c.green('success') : c.red('failed');
      const path = c.gray(item.path);
      const bullet = item.output.success ? c.green('•') : c.red('•');
      console.info('', bullet, path, status);
    });

    if (options.pad) console.log();
    return success;
  },

  /**
   * List of modules at the given path.
   */
  moduleList(args: { index?: t.Index; indent?: number }) {
    let res = '';
    const append = (line: String) => (res += `${line}\n`);
    const indent = args.indent ? ' '.repeat(args.indent) : '';

    for (const [index, path] of Paths.modules.entries()) {
      const isCurrent = typeof args.index === 'number' ? index === args.index : false;
      const dim = (text: string) => (isCurrent ? text : c.dim(text));

      const dir = Path.dirname(path);
      const name = Path.basename(path);
      const nameFmt = isCurrent ? c.bold(c.white(name)) : name;
      const modulePath = dim(c.gray(`${dir}/${nameFmt}`));
      const bullet = dim(isCurrent ? c.white('•') : c.gray('•'));

      append(`${indent}${bullet} ${modulePath}`);
    }

    return res;
  },
} as const;
