import { type t, c, Cli, pkg } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { refreshCache } from './u.refreshCache.ts';
import { getVersionInfo } from './u.ts';

/**
 * Update JUST the @sys/tools CLI by refreshing the JSR cache.
 */
export async function runUpdate(
  cwd: t.StringDir,
  opts: { interactive?: boolean } = {},
): Promise<void> {
  const { interactive = false } = opts;
  const version = await getVersionInfo();

  console.info();
  console.info(Fmt.versionInfoTable(version));
  console.info();

  if (version.is.latest) {
    console.info(c.italic(Fmt.localVersionIsMostRecent(version)));
    console.info();
    return;
  }

  const UPDATE = 'update';
  const EXIT = '__exit__';

  if (interactive) {
    const answer = await Cli.Prompt.Select.prompt<string>({
      message: 'Update',
      options: [
        { name: ` update to ${c.green(version.latest)}`, value: UPDATE },
        { name: c.dim(c.gray(`(exit)`)), value: EXIT },
      ],
    });

    if (answer === EXIT) {
      console.info();
      return;
    }
  }

  const msg = `updating ${c.white(pkg.name)} from ${c.yellow(version.local)} to ${c.green(version.latest)}...`;

  /** Run process: */
  const spinner = Cli.spinner(c.gray(msg)).start();
  const out = await refreshCache(cwd);
  spinner.stop();

  if (!out.success) throw new Error(out.toString());

  console.info(c.gray(`Updated ${c.white(pkg.name)} to latest ${c.green(version.latest + ' ✔')}`));
  console.info();
}
