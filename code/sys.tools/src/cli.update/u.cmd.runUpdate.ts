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
    console.info(Fmt.localVersionIsMostRecent(version));
    console.info();
    return;
  }

  const UPDATE = 'update';
  const EXIT = '__exit__';

  if (interactive) {
    const answer = await Cli.Input.Select.prompt<string>({
      message: 'Run',
      options: [
        { name: ` - update to ${c.green(version.latest)} now`, value: UPDATE },
        { name: c.dim(c.gray(`(exit)`)), value: EXIT },
      ],
    });

    if (answer === EXIT) {
      console.info();
      return;
    }
  }

  const msg = `updating ${c.white(pkg.name)} from ${version.local} to ${c.green(version.latest)}...`;

  /** Run process: */
  const spinner = Cli.Spinner.start(Cli.Fmt.spinnerText(msg));
  const out = await (async () => {
    try {
      return await refreshCache(cwd);
    } finally {
      spinner.stop();
    }
  })();

  if (!out.success) {
    const msg = `Failed to refresh JSR cache for ${pkg.name}. Command: deno cache --reload jsr:@sys/tools\n${out.toString()}`;
    throw new Error(msg);
  }

  console.info(c.gray(`Updated ${c.white(pkg.name)} to latest ${c.green(version.latest + ' ✔')}`));
  console.info();
}
