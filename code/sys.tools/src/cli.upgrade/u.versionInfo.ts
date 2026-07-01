import { Fs, Jsr, pkg, Semver, type t, WorkspaceResolve } from './common.ts';

type FetchPackageVersions = t.Registry.Jsr.Fetch.Pkg.Lib['versions'];
type ResolvePackage = t.WorkspaceResolve.Lib['resolvePackage'];
type GetVersionInfoDeps = {
  readonly versions?: FetchPackageVersions;
  readonly resolvePackage?: ResolvePackage;
  /** Force Deno to reload resolver/cache state before reporting the actionable package. */
  readonly resolverReload?: boolean;
};

export async function getVersionInfo(
  cwd: t.StringDir = Fs.cwd('terminal'),
  deps: GetVersionInfoDeps = {},
): Promise<t.UpgradeTool.VersionInfo> {
  const local = pkg.version as t.StringSemver;
  const versions = deps.versions ?? Jsr.Fetch.Pkg.versions;
  const resolvePackage = deps.resolvePackage ?? WorkspaceResolve.resolvePackage;

  const remote = (await versions(pkg.name)).data?.latest ?? local;
  const resolution = await resolvePackage({
    cwd,
    specifier: `jsr:${pkg.name}`,
    reload: deps.resolverReload ?? false,
  });
  const actionable = resolution.ok ? resolution.resolved : undefined;
  const latest = actionable ?? local;

  const upgradeAvailable = actionable ? Semver.Is.greaterThan(actionable, local) : false;
  const pending = actionable ? Semver.Is.greaterThan(remote, actionable) : false;
  const resolverUnavailable = !resolution.ok;

  return {
    local,
    remote,
    latest,
    actionable,
    resolution,
    is: { latest: !upgradeAvailable, upgradeAvailable, pending, resolverUnavailable },
  };
}
