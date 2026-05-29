import { Jsr, pkg, Semver, type t } from './common.ts';

export async function getVersionInfo(): Promise<t.UpgradeTool.VersionInfo> {
  const local = pkg.version;
  const remote = (await Jsr.Fetch.Pkg.versions(pkg.name)).data?.latest ?? local;
  const latest = Semver.latest(local, remote) ?? remote;
  const isLatest = latest === local;

  const version: t.UpgradeTool.VersionInfo = {
    local,
    remote,
    latest,
    is: { latest: isLatest },
  };
  return version;
}
