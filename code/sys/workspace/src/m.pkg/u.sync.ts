import { c, Fs, type t } from './common.ts';
import { renderPkg } from './u.render.ts';
import { resolvePackagePaths } from './u.source.ts';
import { resolveExistingTargets } from './u.targets.ts';

type DenoPkgJson = {
  name?: unknown;
  version?: unknown;
};

/**
 * Sync generated package metadata files from discovered `deno.json` manifests.
 */
export async function sync(args: t.MonorepoPkg.SyncArgs): Promise<t.MonorepoPkg.SyncResult> {
  const cwd = args.cwd ?? Deno.cwd();
  const packagePaths = await resolvePackagePaths(cwd, args.source);
  const packages: t.MonorepoPkg.PackageResult[] = [];

  for (const packagePath of packagePaths) {
    packages.push(await syncPackage(packagePath));
  }

  const result: t.MonorepoPkg.SyncResult = {
    count: packages.length,
    written: packages.filter((item) => item.kind === 'written').length,
    unchanged: packages.filter((item) => item.kind === 'unchanged').length,
    skipped: packages.filter((item) => item.kind === 'skipped').length,
    touched: packages.flatMap((item) => item.touched),
    packages,
  };

  logSyncResult(result, { cwd, log: args.log });
  return result;
}

async function syncPackage(packagePath: t.StringPath): Promise<t.MonorepoPkg.PackageResult> {
  const denoJsonPath = Fs.join(packagePath, 'deno.json');
  const deno = (await Fs.readJson<DenoPkgJson>(denoJsonPath)).data;

  if (!deno) {
    return skipped(packagePath, 'missing-deno-json');
  }

  const name = typeof deno.name === 'string' && deno.name ? deno.name : undefined;
  const version = typeof deno.version === 'string' && deno.version ? deno.version : undefined;

  if (!name) return skipped(packagePath, 'missing-name', { version });
  if (!version) return skipped(packagePath, 'missing-version', { name });

  const touched = await resolveExistingTargets(packagePath);
  if (touched.length === 0) {
    return skipped(packagePath, 'missing-target-files', { name, version });
  }

  const expected = renderPkg({ name, version });
  let changed = false;

  for (const target of touched) {
    const existing = (await Fs.readText(target)).data;
    if (existing === expected) continue;
    await Fs.write(target, expected);
    changed = true;
  }

  if (changed) {
    return { kind: 'written', packagePath, name, version, touched };
  }

  return { kind: 'unchanged', packagePath, name, version, touched };
}

function skipped(
  packagePath: t.StringPath,
  reason: Extract<t.MonorepoPkg.PackageResult, { kind: 'skipped' }>['reason'],
  data: { name?: string; version?: string } = {},
): t.MonorepoPkg.PackageResult {
  return {
    kind: 'skipped',
    packagePath,
    name: data.name,
    version: data.version,
    touched: [],
    reason,
  };
}

function logSyncResult(
  result: t.MonorepoPkg.SyncResult,
  options: { cwd: t.StringDir; log?: boolean },
) {
  if (!options.log) return;

  for (const item of result.packages) {
    const path = Fs.trimCwd(item.packagePath);
    if (item.kind !== 'written') continue;
    console.info(`${c.cyan('Updated package:')} ${c.gray(path)} ${c.white(`(${item.touched.length} file(s))`)}`);
  }

  const summary = [
    `${result.written} written`,
    `${result.unchanged} unchanged`,
    `${result.skipped} skipped`,
  ].join(', ');
  console.info(`${c.gray('Package metadata sync:')} ${c.white(summary)}`);
}
