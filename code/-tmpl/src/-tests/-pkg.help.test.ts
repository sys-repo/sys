import { describe, expect, Fs, it, makeTmpl, type t, Templates } from '../-test.ts';
import { logTemplate } from './u.ts';

type DenoJson = {
  readonly tasks?: Record<string, string>;
  readonly exports?: Record<string, string>;
};

describe('Template: pkg.help', () => {
  it('folds a help-resource spine safely into a generated pkg template package', async () => {
    const test = await makeRepoWithPkg('ns', 'foo', '@my-scope/foo');
    const name: t.TemplateName = 'pkg.help';
    const def = await Templates[name]();
    const tmpl = await makeTmpl(name);
    const beforeDenoJson = await readPackageDenoJson(test.pkgDir);
    const beforeMod = await readText(Fs.join(test.pkgDir, 'src/mod.ts'));

    const res = await tmpl.write(test.pkgDir);
    await def.default(test.pkgDir);

    logTemplate(name, res);

    const has = async (path: string) => await Fs.exists(Fs.join(test.pkgDir, path));
    expect(await has('src/m.help/mod.ts')).to.eql(true);
    expect(await has('src/m.help/t.ts')).to.eql(true);
    expect(await has('src/m.help/yaml/root.yaml')).to.eql(true);
    expect(await has('src/m.help/-bundle/-bundle.json')).to.eql(true);

    const denoJson = await readPackageDenoJson(test.pkgDir);
    expect(denoJson.exports).to.eql(beforeDenoJson.exports);
    expect(denoJson.tasks?.prep).to.eql('deno task help:bundle');
    expect(denoJson.tasks?.['help:bundle']).to.eql(
      'deno run -RWE ./src/m.help/-bundle/mod.ts',
    );

    const afterMod = await readText(Fs.join(test.pkgDir, 'src/mod.ts'));
    expect(afterMod).to.eql(beforeMod);

    const typesText = await readText(Fs.join(test.pkgDir, 'src/types.ts'));
    expect(typesText).to.contain(`export type * from './m.help/t.ts';`);

    const bundleJson = await readJson<Record<string, string>>(
      Fs.join(test.pkgDir, 'src/m.help/-bundle/-bundle.json'),
    );
    expect(typeof bundleJson['yaml/root.yaml']).to.eql('string');

    const modText = (await Fs.readText(Fs.join(test.pkgDir, 'src/m.help/mod.ts'))).data ?? '';
    const rootText = (await Fs.readText(Fs.join(test.pkgDir, 'src/m.help/u/u.load.ts'))).data ?? '';
    expect(modText).to.include('Object.freeze({');
    expect(rootText).to.include('Object.freeze({');
  });
});

async function makeRepoWithPkg(ns: string, name: string, pkgName: string) {
  const tmp = await Fs.makeTempDir({ prefix: 'tmpl.pkg-help-' });
  const root = tmp.absolute;
  const repoDef = await Templates.repo();
  const repoTmpl = await makeTmpl('repo');
  await repoTmpl.write(root);
  await repoDef.default(root);

  const pkgDir = Fs.join(root, 'code', ns, name);
  const pkgDef = await Templates.pkg();
  const pkgTmpl = await makeTmpl('pkg');
  await pkgTmpl.write(pkgDir);
  await pkgDef.default(pkgDir, { pkgName });

  return { pkgDir } as const;
}

async function readPackageDenoJson(pkgDir: string): Promise<DenoJson> {
  return await readJson<DenoJson>(Fs.join(pkgDir, 'deno.json'));
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson<T>(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data;
}

async function readText(path: string): Promise<string> {
  const res = await Fs.readText(path);
  if (!res.ok || res.data === undefined) throw new Error(`Failed to read text: ${path}`);
  return res.data;
}
