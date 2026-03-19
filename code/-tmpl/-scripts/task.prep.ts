import { Fs } from '@sys/fs';
import { c } from '@sys/cli';
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
import { DenoFile } from '@sys/driver-deno/runtime';
import { makeBundle } from '../src/m.tmpl/u.makeBundle.ts';

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
  const versions = await resolvePublishedPackageVersions(
    repoImportMap,
    PublishedVersion,
    path.rootDenoJson,
    DenoFile,
  );

  const nextImports = syncTemplateImports(repoImportMap, rootImportMap, versions);
  const nextPackage = syncTemplatePackage(repoPackage, rootPackage);

  await writeIfChanged(path.tmplRepoImports, repoImports, nextImports);
  await writeIfChanged(path.tmplRepoPackage, repoPackage, nextPackage);
  await makeBundle();
  logCommitMessage();
}

function logCommitMessage() {
  const commit = c.italic(c.green('chore(tmpl): refresh generated template surfaces and embedded bundle'));
  console.info();
  console.info(c.gray('  commit msg:'), commit);
  console.info();
}
