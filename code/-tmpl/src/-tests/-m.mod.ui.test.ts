import { type t, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import { logTemplate, makeWorkspaceWithPkg } from './u.ts';

describe('Template: m.mod.ui', () => {
  it('run', async () => {
    /**
     * Workspace + pkg scaffold (pkg.deno already applied):
     */
    const test = await makeWorkspaceWithPkg('ns', 'my-module', '@my-scope/foo');
    const name: t.TemplateName = 'm.mod.ui';
    const def = await Templates[name]();
    const tmpl = await makeTmpl(name);

    // Write → init (CLI flow) into /src/ui/<Component>
    const targetDir = Fs.join(test.pkgDir, `src/ui/Button`);
    const res = await tmpl.write(targetDir);
    await def.default(res.dir.target, { name: 'Button' });
    logTemplate('m.mod.ui', res);

    const ls = await test.ls();
    const includes = (endsWith: t.StringPath) => !!ls.find((p: string) => p.endsWith(endsWith));

    /**
     * Assertions:
     */
    {
      // Files created/modified exist at target; no initializer source persisted:
      const written = res.ops
        .filter((o) => o.kind === 'create' || o.kind === 'modify')
        .map((o) => o.path);

      expect(includes('/.tmpl.ts')).to.be.false;

      for (const rel of written) {
        const abs = Fs.join(res.dir.target, rel);
        expect(await Fs.exists(abs)).to.eql(true, `missing written file: ${rel}`);
      }
    }

    {
      // Component naming updated across TS/TSX under the module:
      const glob = Fs.glob(targetDir, { includeDirs: false });
      const files = (await glob.find('**/*.{ts,tsx}')).map((m) => m.path);
      const texts = await Promise.all(files.map(async (p) => (await Fs.readText(p)).data ?? ''));
      const blob = texts.join('\n');

      expect(blob.includes('MyComponent')).to.eql(false, 'should replace all MyComponent');
      expect(blob.includes('Button')).to.eql(true, 'should insert provided component name');
    }

    {
      // types barrel updated to point at the new UI module:
      const typesPath = Fs.join(test.pkgDir, 'src/types.ts');
      const typesText = (await Fs.readText(typesPath)).data ?? '';
      expect(typesText).to.include(`export type * from './ui/Button/t.ts';`);
    }

    {
      // Dev-Harness spec registry updated and stub removed:
      const specsPath = Fs.join(test.pkgDir, 'src/-test/-specs.ts');
      const specsText = (await Fs.readText(specsPath)).data ?? '';

      // Entry added:
      expect(specsText).to.include(' [`${ns}: Button`]: () =>');
      expect(specsText).to.include(`import('../ui/Button/-spec/-SPEC.tsx'),`);

      // Sample stub deleted:
      expect(specsText.includes('// [`${ns}: name`]:')).to.eql(false, 'stub should be removed');
    }

    // Sanity: target UI module exists where expected:
    expect(includes(`/ns/my-module/src/ui/Button/t.ts`)).to.be.true;
  });
});
