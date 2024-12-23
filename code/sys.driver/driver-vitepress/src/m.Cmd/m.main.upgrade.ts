import { Cmd } from '@sys/std-s/process';
import { Semver } from '@sys/std/semver';
import { Tmpl } from '../-tmpl/mod.ts';
import { ViteLog } from '../m.VitePress/common.ts';
import { VitePress } from '../m.VitePress/mod.ts';
import { type t, Args, c, DEFAULTS, Fs, Jsr, Log, pkg } from './common.ts';

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
  const targetVersion = args.version ? Semver.parse(args.version) : semver.latest;
  const diff = Semver.compare(targetVersion, semver.current);

  if (diff === 0 && !force) {
    console.info();
    console.info(`Local version ${c.green(pkg.version)} is already up-to-date.`);
    console.info(c.gray(pkg.name));
    console.info();
    return;
  }

  if (diff !== 0) {
    // Perform version change.
    const version = Semver.toString(targetVersion);
    const isGreater = Semver.Is.greaterThan(targetVersion, semver.current);
    const direction = isGreater ? 'Upgrading' : 'Downgrading';
    console.info();
    console.info(`${direction} local version ${c.gray(pkg.version)} to → ${c.green(version)}`);
    console.info(c.gray(pkg.name));
    console.info();

    const denofile = Tmpl.Pkg.denofile({ pkg: { ...pkg, version } });
    const path = Fs.join(inDir, 'deno.json');
    await Deno.writeTextFile(path, denofile);
    const sh = Cmd.sh(inDir);
    await sh.run('deno install');
    await sh.run('deno task upgrade --force'); // NB: recursion - recall the command to complete the update (below).
    return;
  }

  /**
   * Update project template files.
   */
  const filter = (p: string) => !p.startsWith('docs/');
  const res = await VitePress.Env.update({ filter, inDir, force: false, silent: true });

  console.info(c.green('Updated Environment'));
  Log.filesTable(res.files).render();

  console.info();
  console.info(c.green(`Project at version:`));
  ViteLog.Module.log(pkg);
  console.info();
}
