import { Denofile } from '@sys/driver-deno';
import { Cmd } from '@sys/std-s/process';
import { Semver } from '@sys/std/semver';

import { type t, c, Cli, Fs, Jsr, pkg } from '../common.ts';
import { ViteLog } from '../m.VitePress/common.ts';
import { VitePress } from '../m.VitePress/mod.ts';

/**
 * Perform an upgrade on the local project to the
 * latest released version on JSR.
 */
export async function upgrade(args: { inDir: t.StringDir }) {
  const { inDir } = args;

  /**
   * Migration:
   * Upgrade the state of the local project configuration.
   */
  const registry = (await Jsr.Fetch.Pkg.versions('@sys/driver-vitepress')).data;
  const latest = registry?.latest ?? '0.0.0';
  const semver = {
    latest: Semver.parse(latest),
    current: Semver.parse(pkg.version),
  };
  const diff = Semver.compare(semver.latest, semver.current);

  if (diff <= 0) {
    // Already latest.
    console.info();
    console.info(`Local version ${c.green(pkg.version)} is the most recent release`);
    console.info();
    return;
  }
  if (diff > 0) {
    // Perform update.
    console.info();
    console.info(`Upgrading local version ${c.gray(pkg.version)} to latest: ${c.green(latest)}`);
    console.info();
    const spinner = Cli.spinner('upgrading...').start();

    /**
     * TODO 🐷
     * - await Denofile.change(path, (d) => <mutator>);
     */
    const path = Fs.join(inDir, 'deno.json');
    const json = (await Denofile.load(path)).json ?? {};
    const imports = json.imports || (json.imports = {});
    imports[pkg.name] = `jsr:${pkg.name}@${latest}`;
    await Deno.writeTextFile(path, `${JSON.stringify(json, null, '  ')}\n`);

    console.log('json', json);

    const sh = Cmd.sh(inDir);
    await sh.run('deno install');
    await sh.run('deno task upgrade');

    spinner.clear().stop();
    return;
  }

  console.log(`-------------------------------------------`);
  console.log('TODO 🐷 ');
  console.log('semver', semver);
  console.log('diff', diff);

  // Update template files.
  await VitePress.Env.init({ inDir, force: true });

  console.info();
  ViteLog.Module.log(pkg);
  console.info(c.gray(`Migrated project to version: ${c.green(pkg.version)}`));
  console.info();
}
