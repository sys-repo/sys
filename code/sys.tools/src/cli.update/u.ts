import { type t, Jsr, pkg, Semver } from './common.ts';

export async function getVersionInfo() {
  const jsr = await Jsr.Fetch.Pkg.info(pkg.name);
  const remote = jsr.data?.pkg.version ?? '';
  if (!remote) {
    throw new Error(`Failed to resolve ${pkg.name} version from JSR registry.`);
  }
  const version: t.UpdateTool.VersionInfo = {
    local: pkg.version,
    remote,
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
