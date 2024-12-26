import { Cmd } from '@sys/std-s/process';
import { Semver } from '@sys/std/semver';
import { Env } from '../m.Env/mod.ts';
import { ViteLog } from '../m.VitePress/common.ts';
import { VitePress } from '../m.VitePress/mod.ts';
import { type t, Args, c, DEFAULTS, Jsr, pkg, Tmpl } from './common.ts';

/**
 * Perform an upgrade on the local project to the
 * latest released version on JSR.
 */
export async function upgrade(argv: string[]) {
  const args = Args.parse<t.CmdArgsUpgrade>(argv);
  const { inDir = DEFAULTS.inDir, force = false } = args;

  console.log('function upgrade');

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

  console.log('semver.latest', Semver.toString(semver.latest));
  console.log('semver.current', Semver.toString(semver.current));
  console.log('targetVersion', Semver.toString(targetVersion));

  if (diff === 0 && !force) {
    console.info();
    console.info(`Local version ${c.green(pkg.version)} is already up-to-date.`);
    console.info(c.gray(pkg.name));
    console.info();
    return;
  }

  console.log(`||| ⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔`);
  console.log('diff', diff);

  if (diff !== 0) {
    // Perform version change (up or down).
    const version = Semver.toString(targetVersion);
    const isGreater = Semver.Is.greaterThan(targetVersion, semver.current);
    const direction = isGreater ? 'Upgrading' : 'Downgrading';
    console.info();
    console.info(`${direction} local version ${c.gray(pkg.version)} to → ${c.green(version)}`);
    console.info(c.gray(pkg.name));
    console.info();

    // Update the `deno.json` file with the new version.
    const tmpl = (await Env.tmpl({ inDir, version })).filter((file) => file.name === 'deno.json');
    await tmpl.copy(inDir, { force: true });

    console.log(`-------------------------------------------`);

    // Install and run.
    const sh = Cmd.sh({ path: inDir, silent: false });
    await sh.run('deno install');
    console.log('after install');
    await sh.run('deno task upgrade --force'); // NB: recursion - recall the command to complete the update (below).
    return;
  }

  console.log(`AFTER ⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔ ||||`);

  /**
   * Update project template files.
   */
  const res = await VitePress.Env.update({ inDir, force, silent: true });
  console.log('res', res);

  /**
   * Finish up.
   */
  console.info(c.green('Updated Environment'));
  console.info(Tmpl.Log.table(res.ops, { indent: 2 }));
  console.info();
  console.info(c.green(`Project at version:`));
  ViteLog.Module.log(pkg);
  console.info();
}
