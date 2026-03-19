import { Fs } from '@sys/fs';
import { c } from '@sys/cli';
import type * as t from '@sys/types';
import {
  PATH,
  PublishedVersion,
  assertImportMap,
  readJson,
  resolvePackageVersions,
  resolvePublishedPackageVersions,
  syncTemplateImports,
  syncTemplatePackage,
  writeIfChanged,
} from './-prep.u.ts';
import { DenoFile } from '@sys/driver-deno/runtime';
import { makeBundle } from '../src/m.tmpl/u.makeBundle.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const path = PATH.fromRoot(root);

export type VersionSource = 'workspace' | 'published';

type Options = {
  readonly versionSource?: VersionSource;
};

export async function main(options: Options = {}) {
  const [repoImports, repoPackage, rootPackage, rootImports] = await Promise.all([
    readJson<t.Json>(path.tmplRepoImports),
    readJson<t.PkgJsonNode>(path.tmplRepoPackage),
    readJson<t.PkgJsonNode>(path.rootPackage),
    readJson<t.Json>(path.rootImports),
  ]);

  const repoImportMap = assertImportMap(repoImports, path.tmplRepoImports);
  const rootImportMap = assertImportMap(rootImports, path.rootImports);
  const versions = await resolveVersions(options.versionSource ?? 'workspace', repoImportMap);

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

export function resolveVersions(
  versionSource: VersionSource,
  imports: ReturnType<typeof assertImportMap>,
) {
  return versionSource === 'published'
    ? resolvePublishedPackageVersions(imports, PublishedVersion, path.rootDenoJson, DenoFile)
    : resolvePackageVersions(path.rootDenoJson, imports, DenoFile);
}

if (import.meta.main) await main();
