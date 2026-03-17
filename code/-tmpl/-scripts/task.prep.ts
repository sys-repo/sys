import { Fs } from '@sys/fs';
import type * as t from '@sys/types';
import {
  PATH,
  PublishedVersion,
  assertImportMap,
  readJson,
  resolvePublishedPackageVersions,
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
  const versions = await resolvePublishedPackageVersions(repoImportMap, PublishedVersion);

  const nextImports = syncTemplateImports(repoImportMap, rootImportMap, versions);
  const nextPackage = syncTemplatePackage(repoPackage, rootPackage);

  await writeIfChanged(path.tmplRepoImports, repoImports, nextImports);
  await writeIfChanged(path.tmplRepoPackage, repoPackage, nextPackage);
}
