import { c, Cli, Cmd, Fs, Semver } from '@sys/std-s';
import type { CmdOutput } from '@sys/std-s/t';

export { Path, Paths } from './u.paths.ts';
export { c, Cli, Cmd, Fs, Semver };

export type CmdResult = {
  output: CmdOutput;
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
} as const;
