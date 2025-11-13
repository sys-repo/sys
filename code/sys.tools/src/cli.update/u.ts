import { type t, Jsr, pkg, Semver } from './common.ts';

export async function getVersionInfo() {
  const jsr = await Jsr.Fetch.Pkg.info(pkg.name);
  const version: t.UpdateVersionInfo = {
    local: pkg.version,
    remote: jsr.data?.pkg.version ?? '',
    get latest() {
      return Semver.latest(version.local, version.remote) ?? '';
    },
    get is() {
      const latest = version.local === version.latest;
      return { latest };
    },
  };
  return version;
}
