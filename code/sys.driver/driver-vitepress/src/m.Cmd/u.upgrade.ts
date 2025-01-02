import { Process } from '@sys/proc';
import { Semver } from '@sys/std/semver';
import { ViteLog } from '../m.VitePress/common.ts';
import { type t, Args, c, Jsr, PATHS, pkg } from './common.ts';

/**
 * Perform an upgrade on the local project to the
 * latest released version on JSR.
 */
export async function upgrade(argv: string[]) {
  const args = Args.parse<t.CmdArgsUpgrade>(argv);
  const { inDir = PATHS.inDir, force = false } = args;

  if (args.cmd !== 'upgrade') return;

  /**
   * Migration:
   * Upgrade the state of the local project configuration.
   */
  const registry = (await Jsr.Fetch.Pkg.versions('@sys/driver-vitepress')).data;
  const latest = registry?.latest ?? '0.0.0';
  const semver = { latest: Semver.parse(latest), current: Semver.parse(pkg.version) };
  const targetVersion = args.version ? Semver.parse(args.version) : semver.latest;
  const diff = Semver.compare(targetVersion, semver.current);

  if (diff === 0 && !force) {
    console.info();
    console.info(`Local version ${c.green(pkg.version)} is already up-to-date.`);
    console.info(c.gray(pkg.name));
    console.info();
    return;
  }

  if (diff !== 0 || force) {
    // Perform version change (up or down).
    const version = Semver.toString(targetVersion);
    const isGreater = Semver.Is.greaterThan(targetVersion, semver.current);
    const direction = isGreater ? 'Upgrading' : 'Downgrading';
    const cmd = `deno run -A jsr:@sys/driver-vitepress@${version}/init`;

    console.info();
    console.info(`${direction} local version ${c.gray(pkg.version)} to → ${c.green(version)}`);
    console.info(c.gray(`${c.italic('running template:')} ${c.cyan(cmd)}`));
    console.info();

    // Install and run.
    await Process.sh({ path: inDir }).run(cmd);
  }

  /**
   * Finish up.
   */
  console.info();
  console.info(c.green(`Project at version:`));
  ViteLog.Module.log({ ...pkg, version: Semver.toString(targetVersion) });
  console.info();
}
