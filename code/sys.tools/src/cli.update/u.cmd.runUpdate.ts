import { type t, c, Cli, pkg, Process } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { getVersionInfo } from './u.ts';

/**
 * Update JUST the @sys/tools CLI by refreshing the JSR cache.
 */
export async function runUpdate(cwd: t.StringDir): Promise<void> {
  const version = await getVersionInfo();

  console.info();
  console.info(Fmt.versionInfoTable(version));
  console.info();

  if (version.is.latest) {
    console.info(c.italic(Fmt.localVersionIsMostRecent(version)));
    console.info();
    return;
  }

  const msg = `updating ${c.white(pkg.name)} from ${c.yellow(version.local)} to ${c.green(version.latest)}...`;
  const spinner = Cli.spinner(c.gray(msg)).start();
  const out = await Process.invoke({
    cmd: 'deno',
    args: ['cache', '--reload', 'jsr:@sys/tools'],
    cwd,
    silent: false,
  });

  spinner.stop();
  if (!out.success) throw new Error(out.toString());

  console.info(c.gray(`Updated ${c.white(pkg.name)} to latest ${c.green(version.latest + ' ✔')}`));
  console.info();
}
