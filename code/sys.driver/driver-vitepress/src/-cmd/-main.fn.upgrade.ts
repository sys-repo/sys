import { Cmd } from '@sys/std-s/process';
import { Semver } from '@sys/std/semver';
import { Tmpl } from '../-tmpl/mod.ts';
import { ViteLog } from '../m.VitePress/common.ts';
import { VitePress } from '../m.VitePress/mod.ts';
import { type t, Args, c, DEFAULTS, Fs, Jsr, pkg } from './common.ts';

/**
 * Perform an upgrade on the local project to the
 * latest released version on JSR.
 */
export async function upgrade(argv: string[]) {
  const args = Args.parse<t.CmdArgsUpgrade>(argv);
  const { inDir = DEFAULTS.inDir, force = false } = args;
  if (args.cmd !== 'upgrade') return;

  /**
   * Migration:
   * Upgrade the state of the local project configuration.
   */
  const registry = (await Jsr.Fetch.Pkg.versions('@sys/driver-vitepress')).data;
  const latest = registry?.latest ?? '0.0.0';
  const semver = { latest: Semver.parse(latest), current: Semver.parse(pkg.version) };
  const diff = Semver.compare(semver.latest, semver.current);

  if (diff === 0 && !force) {
    console.info();
    console.info(`Local version ${c.green(pkg.version)} is the most recent release`);
    console.info(c.gray(pkg.name));
    console.info();
    return;
  }

  if (diff > 0) {
    // Perform upgrade.
    console.info();
    console.info(`Upgrading local version ${c.gray(pkg.version)} to latest → ${c.green(latest)}`);
    console.info(c.gray(pkg.name));
    console.info();

    const version = latest;
    const denofile = Tmpl.Pkg.denofile({ pkg: { ...pkg, version } });
    await Deno.writeTextFile(Fs.join(inDir, 'deno.json'), denofile);

    const sh = Cmd.sh(inDir);
    await sh.run('deno install');
    await sh.run('deno task upgrade --force'); // NB: recursion - recall the command to complete the update (below).
    return;
  }

  /**
   * Update project template files.
   */
  await VitePress.Env.init({ inDir, force: true, filter: (p) => !p.startsWith('docs/') });
  console.info();

  console.info(c.green(`Project at version:`));
  ViteLog.Module.log(pkg);
  console.info();
}
