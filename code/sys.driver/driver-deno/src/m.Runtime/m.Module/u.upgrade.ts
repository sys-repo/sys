import { type t, c, Semver, Jsr, Process } from './common.ts';

export const upgrade: t.DenoModuleLib['upgrade'] = async (args) => {
  const { force = false } = args;

  const done = () => {
    const res: t.DenoModuleUpgradeResponse = {
      version: {
        from: Semver.toString(semver.current),
        to: Semver.toString(targetVersion),
      },
      get changed() {
        return !Semver.Is.eql(semver.current, targetVersion);
      },
    };
    return res;
  };

  /**
   * Migration:
   * Upgrade the state of the local project configuration.
   */
  const moduleName = args.name;
  const registry = (await Jsr.Fetch.Pkg.versions(moduleName)).data;
  const latest = registry?.latest ?? '0.0.0';
  const semver = { latest: Semver.parse(latest), current: Semver.parse(args.currentVersion) };
  const targetVersion = args.targetVersion ? Semver.parse(args.targetVersion) : semver.latest;
  const diff = Semver.compare(targetVersion, semver.current);


  if (diff === 0 && !force) {
    const v = Semver.toString(semver.current);
    console.info();
    console.info(`Local version ${c.green(c.bold(v))} is already up-to-date.`);
    console.info(c.gray(moduleName));
    console.info();
    return done();
  }

  if (diff !== 0 || force) {
    // Perform version change (up or down).
    const current = Semver.toString(semver.current);
    const version = Semver.toString(targetVersion);
    const isGreater = Semver.Is.greaterThan(targetVersion, semver.current);
    const direction = isGreater ? 'Upgrading' : 'Downgrading';
    const msg = `${direction} local version ${c.gray(current)} to → ${c.green(version)}`;


    const cmd = `deno run -A jsr:${moduleName}@${version}/init`;
    console.info();
    console.info(msg);
    console.info(c.gray(`${c.italic('running template:')} ${c.cyan(cmd)}`));
    console.info();

    // Install and run.
    const path = args.dir;
    await Process.sh({ path }).run(cmd);
  }

  /**
   * Finish up.
   */
  console.info();
  console.info(c.green(`Project at version:`));
  Log.Module.log({ name: moduleName, version: Semver.toString(targetVersion) });
  console.info();

  return done();
};

/**
 * Helpers
 */

export const Log = {
  Module: {
    log: (pkg: t.Pkg) => console.info(Log.Module.toString(pkg)),
    toString(pkg: t.Pkg) {
      return c.gray(`${c.white(c.bold(pkg.name))}@${c.bold(c.cyan(pkg.version))}`);
    },
  },
} as const;
