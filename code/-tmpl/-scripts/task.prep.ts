import { Args } from '@sys/std';
import { Fs } from '@sys/fs';
import { Cli } from '@sys/cli';
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
export type CommitContext = 'tmpl' | 'bump';

type Options = {
  readonly versionSource?: VersionSource;
  readonly commitContext?: CommitContext;
};

type TArgs = {
  'version-source'?: VersionSource;
  'commit-context'?: CommitContext;
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
  logCommitMessage(options.commitContext ?? 'tmpl');
}

function logCommitMessage(context: CommitContext) {
  const commit = context === 'bump'
    ? 'chore(bump): update package versions and refresh generated outputs'
    : 'chore(tmpl): refresh generated template surfaces and embedded bundle';
  const suggestion = Cli.Fmt.Commit.suggestion(commit, { title: false, message: { color: 'green' } });
  console.info();
  console.info(`  ${suggestion}`);
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

function parseArgs(argv = Deno.args): Options {
  const args = Args.parse<TArgs>(argv, {
    string: ['version-source', 'commit-context'],
  });

  return {
    versionSource: args['version-source'],
    commitContext: args['commit-context'],
  };
}

if (import.meta.main) await main(parseArgs());
