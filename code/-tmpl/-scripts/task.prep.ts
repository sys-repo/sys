import { Args } from '@sys/std/args';
import { Fs } from '@sys/fs';
import { Cli } from '@sys/cli';
import type * as t from '@sys/types';
import { DenoDeps } from '@sys/driver-deno/runtime';
import {
  assertImportMap,
  PATH,
  PublishedExports,
  PublishedVersion,
  assertPublishedImportExports,
  augmentImportMapFromSpecifiers,
  augmentTemplateDeps,
  collectTemplateBareImports,
  readJson,
  resolvePackageVersions,
  resolvePublishedPackageVersions,
  syncTemplateDeps,
  syncTemplateImports,
  syncTemplatePackage,
  writeIfChanged,
  writeTextIfChanged,
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
  const [repoDepsText, repoImports, repoPackage, rootPackage, rootImports] = await Promise.all([
    Fs.readText(path.tmplRepoDeps).then((res) => {
      if (!res.ok || res.data === undefined) {
        throw new Error(`Failed to read: ${path.tmplRepoDeps}`);
      }
      return res.data;
    }),
    readJson<t.Json>(path.tmplRepoImports),
    readJson<t.PkgNodeJson>(path.tmplRepoPackage),
    readJson<t.PkgNodeJson>(path.rootPackage),
    readJson<t.Json>(path.rootImports),
  ]);

  const repoImportMap = assertImportMap(repoImports, path.tmplRepoImports);
  const rootImportMap = assertImportMap(rootImports, path.rootImports);
  const templateSpecifiers = await collectTemplateBareImports([
    Fs.join(root, 'code/-tmpl/-templates/tmpl.repo'),
    Fs.join(root, 'code/-tmpl/-templates/tmpl.pkg'),
  ]);
  const repoImportMapAugmented = augmentImportMapFromSpecifiers(
    repoImportMap,
    rootImportMap,
    templateSpecifiers,
  );
  const versionSource = options.versionSource ?? 'workspace';
  const versions = await resolveVersions(versionSource, repoImportMapAugmented);
  if (versionSource === 'published') {
    await assertPublishedImportExports(repoImportMapAugmented, versions, PublishedExports);
  }
  const repoDeps = await DenoDeps.from(repoDepsText);
  if (repoDeps.error || !repoDeps.data) {
    throw new Error(`Failed to read deps manifest: ${path.tmplRepoDeps}`);
  }

  const nextImports = syncTemplateImports(repoImportMapAugmented, rootImportMap, versions);
  const nextPackage = syncTemplatePackage(repoPackage, rootPackage);
  const nextDepsAugmented = augmentTemplateDeps(repoDeps.data.deps, templateSpecifiers, versions);
  const nextDeps = syncTemplateDeps(nextDepsAugmented, versions, rootPackage);
  const nextDepsText = DenoDeps.toYaml(nextDeps).text;

  await writeTextIfChanged(path.tmplRepoDeps, repoDepsText, nextDepsText);
  await writeIfChanged(path.tmplRepoImports, repoImports, nextImports);
  await writeIfChanged(path.tmplRepoPackage, repoPackage, nextPackage);
  await makeBundle();
  logCommitMessage(options.commitContext ?? 'tmpl');
}

function logCommitMessage(context: CommitContext) {
  const commit = context === 'bump'
    ? 'chore(bump): update package versions and refresh generated outputs'
    : 'chore(tmpl): refresh generated template surfaces and embedded bundle';
  const suggestion = Cli.Fmt.Commit.suggestion(commit, {
    title: false,
    message: { color: 'gray' },
  });
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
