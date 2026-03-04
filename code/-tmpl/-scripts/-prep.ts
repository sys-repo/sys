import { Fs } from '@sys/fs';
import type * as t from '@sys/types';
import {
  PATH,
  assertImportMap,
  assertVersionMeta,
  readJson,
  syncTemplateImports,
  syncTemplatePackage,
  writeIfChanged,
} from './-prep.u.ts';

const root = Fs.resolve(import.meta.dirname ?? '.', '../../..');
const path = PATH.fromRoot(root);

await main();

async function main() {
  const [repoImports, repoPackage, rootPackage, rootImports, tmplPkg, presetPkg, toolsPkg] = await Promise.all([
    readJson<t.Json>(path.tmplRepoImports),
    readJson<t.PkgJsonNode>(path.tmplRepoPackage),
    readJson<t.PkgJsonNode>(path.rootPackage),
    readJson<t.Json>(path.rootImports),
    readJson<t.Json>(path.tmplPkg),
    readJson<t.Json>(path.presetPkg),
    readJson<t.Json>(path.toolsPkg),
  ]);

  assertImportMap(rootImports, path.rootImports);
  const tmplMeta = assertVersionMeta(tmplPkg, path.tmplPkg);
  const presetMeta = assertVersionMeta(presetPkg, path.presetPkg);
  const toolsMeta = assertVersionMeta(toolsPkg, path.toolsPkg);
  const versions = {
    tmpl: tmplMeta.version,
    preset: presetMeta.version,
    tools: toolsMeta.version,
  } as const;

  const nextImports = syncTemplateImports(assertImportMap(repoImports, path.tmplRepoImports), versions);
  const nextPackage = syncTemplatePackage(repoPackage, rootPackage);

  await writeIfChanged(path.tmplRepoImports, repoImports, nextImports);
  await writeIfChanged(path.tmplRepoPackage, repoPackage, nextPackage);
}
