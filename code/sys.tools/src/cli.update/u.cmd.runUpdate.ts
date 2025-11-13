import { type t, c, Cli, Jsr, pkg, Process, Semver } from './common.ts';

export type UpdateOptions = {
  cwd?: t.StringPath; // default: Deno.cwd()
};

/**
 * Update JUST the @sys/tools CLI by refreshing the JSR cache.
 */
export async function runUpdate(options: UpdateOptions = {}): Promise<void> {
  const cwd = options.cwd ?? Deno.cwd();

  const jsr = await Jsr.Fetch.Pkg.info('@sys/tools');
  const version = {
    local: pkg.version,
    remote: jsr.data?.pkg.version,
    get latest() {
      return Semver.latest(version.local, version.remote) ?? '-';
    },
  };

  const formatVersion = (v?: t.StringSemver) => {
    if (!v) return c.gray('-');
    return v === version.latest ? c.green(v) : c.yellow(v);
  };

  const table = Cli.table([]);
  table.push([c.gray('Package'), pkg.name]);
  table.push([c.gray('  local'), formatVersion(version.local)]);
  table.push([c.gray('  remote'), formatVersion(version.remote)]);
  console.info();

  if (version.local === version.latest) {
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
    silent: true, // print controlled manually
  });

  spinner.stop();
  if (!out.success) throw new Error(out.toString());

  console.info(c.gray(`Updated ${c.white(pkg.name)} to ${c.green(version.latest)}`));
  console.info();
}
