import { type t, c, Cli, Jsr, Process, Semver, stripAnsi } from './common.ts';

export const upgrade: t.DenoModuleLib['upgrade'] = async (args) => {
  const { force = false, dryRun = false } = args;

  let changed = false;
  const done = () => {
    const from = Semver.toString(semver.current);
    const to = Semver.toString(targetVersion);
    const res: t.DenoModuleUpgrade = { version: { from, to }, changed, dryRun };
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
    console.info(c.brightCyan(moduleName));
    console.info(`Local version ${c.green(c.bold(v))} is already up-to-date.`);
    console.info();
    return done();
  }

  if (diff !== 0 || force) {
    // Perform version change (up or down).
    const current = Semver.toString(semver.current);
    const version = Semver.toString(targetVersion);
    const isGreater = Semver.Is.greaterThan(targetVersion, semver.current);
    const isEqual = Semver.Is.eql(targetVersion, semver.current);

    let msg = 'no change';
    if (isEqual) {
      msg = `Re-running templates for version ${c.green(c.bold(version))}`;
    } else {
      const direction = isGreater ? 'Upgrading' : 'Downgrading';
      msg = `${direction} local version ${c.gray(current)} to → ${c.green(c.bold(version))}`;
    }

    if (args.beforeUpgrade) {
      const message = stripAnsi(msg);
      await args.beforeUpgrade({ message });
    }

    const path = args.dir;
    const cmd = `deno run -A jsr:${moduleName}@${version}/init`;
    console.info();
    console.info(msg);

    const table = Cli.table(['', '']);
    const fmtSkipped = args.dryRun ? c.yellow(c.italic('← skipped (dry-run)')) : '';
    const fmtCmd = c.cyan(args.dryRun ? c.dim(cmd) : cmd);
    table.push([c.gray(c.italic('running template:')), `${fmtCmd} ${fmtSkipped}`]);
    table.push([c.gray('target:'), c.gray(path || './')]);
    console.info(table.toString().trim());
    console.info();

    // Install and run.
    if (!args.dryRun) {
      changed = true;
      await Process.sh({ path }).run(cmd);
    }
  }

  /**
   * Finish up.
   */
  const fmtTargetVer = c.bold(c.green(Semver.toString(targetVersion)));
  console.info(c.green(`Project at version:`));
  console.info(c.gray(`${c.white(c.bold(moduleName))}@${fmtTargetVer}`));
  console.info();

  return done();
};
