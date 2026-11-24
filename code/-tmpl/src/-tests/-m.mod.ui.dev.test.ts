import { DenoDeps } from '@sys/driver-deno/runtime';
import type { DenoFile } from '@sys/driver-deno/t';
import { describe, expect, Fs, Is, it, makeTmpl, Path, Process, Templates } from '../-test.ts';
import { TmplTesting } from '../m.testing/mod.ts';
import { makeWorkspace } from './u.ts';

const repoTemplate = Path.fromFileUrl(new URL('../../-templates/tmpl.repo/', import.meta.url));
const devSpecifier = '@sys/ui-components/react/dev';

describe('Template: UI debug controls', () => {
  it('authored repo import map → canonical Dev dependency', async () => {
    const manifest = await DenoDeps.from(Fs.join(repoTemplate, '-deps.yaml'));
    if (!manifest.data) {
      throw new Error('Missing repo dependency manifest', { cause: manifest.error });
    }
    const projected = DenoDeps.toJson('deno.json', manifest.data.deps);
    const expected = projected.imports?.[devSpecifier];
    if (!Is.str(expected)) throw new Error(`Dependency manifest must declare ${devSpecifier}`);

    const path = Fs.join(repoTemplate, 'imports.json');
    const map = await Fs.readJson<DenoFile.ImportMap.Json>(path);
    if (!map.data?.imports) {
      throw new Error(`Missing template import map: ${path}`, { cause: map.error });
    }
    expect(map.data.imports[devSpecifier]).to.eql(expected);
  });

  it('embedded repo + UI templates → barrel-owned controls that type-check locally', async () => {
    const { root } = await makeWorkspace();
    try {
      // Generate repo first; the package initializer owns workspace registration.
      await (await makeTmpl('repo')).write(root, { force: true });
      const pkgDir = Fs.join(root, 'code/example');
      await (await makeTmpl('pkg')).write(pkgDir);
      await (await Templates.pkg()).default(pkgDir, { pkgName: '@test/ui-dev' });

      // Check the shipped mapping before localization can supply a missing entry.
      const generated = await TmplTesting.LocalRepoAuthorities.read(root);
      const componentPackage = generated.imports['@sys/ui-components'];
      expect(generated.imports[devSpecifier]).to.eql(`${componentPackage}/react/dev`);

      const debugPaths: string[] = [];
      const components = [
        { template: 'm.mod.ui', name: 'Example' },
        { template: 'm.mod.ui.controller', name: 'ExampleController' },
      ] as const;

      for (const { template, name } of components) {
        const target = Fs.join(pkgDir, 'src/ui', name);
        await (await makeTmpl(template)).write(target);
        await (await Templates[template]()).default(target, { name });
        const debugPath = Fs.join(target, '-spec/-SPEC.Debug.tsx');
        const source = await readText(debugPath);
        const common = await readText(Fs.join(target, '-spec/common.ts'));

        // Pin barrel ownership and control kinds; the compiler checks the wiring.
        expect(common, template).to.include(`export { Dev } from '${devSpecifier}'`);
        expect(source, template).not.to.include(devSpecifier);
        expect(source, template).to.include('<Dev.Button');
        expect(source, template).to.include('<Dev.ObjectView');
        expect(source, template).not.to.include('<Button');
        expect(source, template).not.to.include('<ObjectView');
        debugPaths.push(debugPath);
      }

      // One compiler check for both modules, resolving Dev to the exact current export.
      const local = await TmplTesting.LocalRepoAuthorities.rewrite({ root });
      const expectedPath = Path.fromFileUrl(import.meta.resolve(devSpecifier));
      expect(local.imports[devSpecifier]).to.eql(expectedPath);
      const checked = await Process.invoke({
        cmd: 'deno',
        args: ['check', '--config', Fs.join(root, 'deno.json'), ...debugPaths],
        cwd: root,
        silent: true,
      });
      if (!checked.success) {
        const detail = `${checked.text.stdout}\n${checked.text.stderr}`;
        throw new Error(`Generated debug type-check failed (exit ${checked.code}):\n${detail}`);
      }
    } finally {
      await Fs.remove(root);
    }
  });
});

async function readText(path: string) {
  const res = await Fs.readText(path);
  if (!Is.str(res.data)) throw new Error(`Failed to read ${path}`, { cause: res.error });
  return res.data;
}
