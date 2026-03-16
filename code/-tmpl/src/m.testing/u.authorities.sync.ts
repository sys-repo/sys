import type { t } from './common.ts';

export function localizeAuthorities(
  current: t.TmplTesting.LocalRepoAuthorities,
  workspace: t.WorkspaceAuthorities,
): t.TmplTesting.LocalRepoAuthorities {
  return {
    imports: { ...current.imports, ...workspace.imports },
    packageJson: syncPackageJson(current.packageJson, workspace.packageJson),
  };
}

function syncPackageJson(current: t.PackageJson, root: t.PackageJson): t.PackageJson {
  return {
    ...current,
    dependencies: syncDependencyGroup(current.dependencies, root),
    devDependencies: syncDependencyGroup(current.devDependencies, root),
  };
}

function syncDependencyGroup(
  current: Record<string, string> | undefined,
  root: t.PackageJson,
): Record<string, string> | undefined {
  if (!current) return undefined;
  const rootDeps = { ...root.dependencies, ...root.devDependencies };
  const next: Record<string, string> = {};

  for (const name of Object.keys(current)) {
    const version = rootDeps[name];
    if (!version) throw new Error(`Missing workspace package authority for "${name}".`);
    next[name] = version;
  }

  return next;
}
