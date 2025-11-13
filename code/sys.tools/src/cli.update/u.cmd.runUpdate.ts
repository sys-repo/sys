import { type t, c, Cli, Jsr, pkg, Process, Semver } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { getVersionInfo } from './u.ts';

export type UpdateOptions = {
  cwd?: t.StringPath; // default: Deno.cwd()
};

/**
 * Update JUST the @sys/tools CLI by refreshing the JSR cache.
 */
export async function runUpdate(options: UpdateOptions = {}): Promise<void> {
  const cwd = options.cwd ?? Deno.cwd();
  const version = await getVersionInfo();

  console.info(Fmt.versionInfoTable(version));
  console.info();

  if (version.is.latest) {
    const msg = `Local version ${c.green(version.local)} of ${c.white(pkg.name)} is the most recent release`;
    console.info(c.gray(msg));
    console.info();
    return;
  }

  const msg = `updating ${c.white(pkg.name)} from ${version.local} to ${c.green(version.latest)}...`;
  const spinner = Cli.spinner(c.gray(msg)).start();
  const out = await Process.invoke({
    cmd: 'deno',
    args: ['cache', '--reload', 'jsr:@sys/tools'],
    cwd,
    silent: false,
  });

  spinner.stop();
  if (!out.success) throw new Error(out.toString());

  console.info(c.gray(`Updated ${c.white(pkg.name)} to ${c.green(version.latest)}`));
  console.info();
}
