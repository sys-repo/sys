import { Fs } from '@sys/fs';
import type * as t from '@sys/types';
import {
  PATH,
  assertImportMap,
  assertVersionMeta,
  readJson,
  sysPackageName,
  syncTemplateImports,
  syncTemplatePackage,
  writeIfChanged,
} from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  const [repoImports, repoPackage, rootPackage, rootImports] = await Promise.all([
    readJson<t.Json>(path.tmplRepoImports),
    readJson<t.PkgJsonNode>(path.tmplRepoPackage),
    readJson<t.PkgJsonNode>(path.rootPackage),
    readJson<t.Json>(path.rootImports),
  ]);

  const repoImportMap = assertImportMap(repoImports, path.tmplRepoImports);
  const rootImportMap = assertImportMap(rootImports, path.rootImports);
  const versions = await resolvePackageVersions(root, repoImportMap);

  const nextImports = syncTemplateImports(repoImportMap, rootImportMap, versions);
  const nextPackage = syncTemplatePackage(repoPackage, rootPackage);

  await writeIfChanged(path.tmplRepoImports, repoImports, nextImports);
  await writeIfChanged(path.tmplRepoPackage, repoPackage, nextPackage);
}

async function resolvePackageVersions(root: string, imports: { imports: Record<string, string> }) {
  const pkgs = [
    ...new Set(
      Object.keys(imports.imports)
        .map(sysPackageName)
        .filter((pkg): pkg is string => typeof pkg === 'string'),
    ),
  ];
  const entries = await Promise.all(pkgs.map(async (pkg) => [pkg, await readPackageVersion(root, pkg)] as const));
  return Object.fromEntries(entries);
}

async function readPackageVersion(root: string, pkg: string) {
  const path = packageConfigPath(root, pkg);
  const json = await readJson<t.Json>(path);
  return assertVersionMeta(json, path).version;
}

function packageConfigPath(root: string, pkg: string): string {
  const name = pkg.replace('@sys/', '');
  if (name === 'tmpl') return Fs.join(root, 'code/-tmpl/deno.json');
  if (name === 'tools') return Fs.join(root, 'code/sys.tools/deno.json');
  return Fs.join(root, 'code/sys', name, 'deno.json');
}
