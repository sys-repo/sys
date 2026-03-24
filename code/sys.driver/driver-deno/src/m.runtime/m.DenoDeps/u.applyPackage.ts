import { type t, Fs, Is, Obj, isEmptyRecord } from './common.ts';
import { toPackageJson } from './u.toJson.package.ts';

const D = {
  packageFilePath: './package.json',
} as const;

/**
 * Apply package dependencies onto a target `package.json` file.
 */
export async function applyPackage(
  path: t.StringPath | undefined,
  deps?: t.Dep[],
): Promise<t.DenoDeps.ApplyPackageResult> {
  const packageFilePath = path ?? D.packageFilePath;
  const current = await Fs.readJson<t.Json>(packageFilePath);
  const packageJson =
    current.ok && Is.record<Record<string, t.Json>>(current.data) ? { ...current.data } : {};
  const next = toPackageJson(deps);

  if (next.dependencies && !isEmptyRecord(next.dependencies)) {
    packageJson.dependencies = next.dependencies;
  }
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
