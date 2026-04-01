import { type t, Fs, Is, isEmptyRecord } from './common.ts';
import { toPackageJson } from './u.toJson.package.ts';

/**
 * Apply package dependencies onto a target `package.json` file.
 */
export async function applyPackage(
  path: t.StringPath | undefined,
  entries?: t.EsmDeps.Entry[],
): Promise<t.EsmDeps.ApplyPackageResult | undefined> {
  if (!path) return undefined;

  const packageFilePath = path;
  const current = await Fs.readJson<t.Json>(packageFilePath);
  const packageJson =
    current.ok && Is.record<Record<string, t.Json>>(current.data) ? { ...current.data } : {};
  const next = toPackageJson(entries);

  if (next.dependencies && !isEmptyRecord(next.dependencies)) packageJson.dependencies = next.dependencies;
  else delete packageJson.dependencies;

  if (next.devDependencies && !isEmptyRecord(next.devDependencies)) {
    packageJson.devDependencies = next.devDependencies;
  } else delete packageJson.devDependencies;

  await Fs.writeJson(packageFilePath, packageJson);

  return {
    packageFilePath,
    dependencies: next.dependencies ?? {},
    devDependencies: next.devDependencies ?? {},
  };
}
