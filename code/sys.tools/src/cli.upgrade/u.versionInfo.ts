import { Fs, Jsr, pkg, type t, WorkspaceResolve } from './common.ts';
import { toVersionState } from './u.versionState.ts';

type FetchPackageVersions = t.Registry.Jsr.Fetch.Pkg.Lib['versions'];
type ResolvePackage = t.WorkspaceResolve.Lib['resolvePackage'];
type GetVersionInfoDeps = {
  readonly versions?: FetchPackageVersions;
  readonly resolvePackage?: ResolvePackage;
  /** Force Deno to reload resolver/cache state before reporting the held/upgrade version. */
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
  const resolverOptions = {
    cwd,
    reload: deps.resolverReload ?? false,
    noConfig: true,
    noLock: true,
  } as const;
  const resolution = await resolvePackage({
    ...resolverOptions,
    specifier: `jsr:${pkg.name}`,
  });
  const actionable = resolution.ok ? resolution.resolved : undefined;
  const latest = actionable ?? local;
  const base = { local, remote, latest, actionable, resolution } as const;
  const initial = toVersionState(base);
  const latestResolution = initial.pending
    ? await resolvePackage({
      ...resolverOptions,
      specifier: `jsr:${pkg.name}@${remote}`,
    })
    : undefined;
  const state = toVersionState({ ...base, latestResolution });

  return {
    ...base,
    latestResolution,
    is: {
      latest: !state.upgradeAvailable,
      upgradeAvailable: state.upgradeAvailable,
      pending: state.pending,
      resolverUnavailable: state.resolverUnavailable,
    },
  };
}
