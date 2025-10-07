import { type t, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import { logTemplate, makeWorkspaceWithPkg } from './u.ts';

describe('Template: m.mod', () => {
  it('run', async () => {
    /**
     * Workspace + pkg scaffold (pkg.deno already applied):
     */
    const test = await makeWorkspaceWithPkg('ns', 'my-module', '@my-scope/foo');
    const srcDir = Fs.join(test.pkgDir, 'src');

    const name: t.TemplateName = 'm.mod';
    const def = await Templates[name]();
    const tmpl = await makeTmpl(name);

    // Write → init (CLI flow)
    const targetDir = Fs.join(test.pkgDir, 'src/m.MyModule');
    const res = await tmpl.write(targetDir);
    await def.default(res.dir.target);
    logTemplate('m.mod', res);

    const ls = await test.ls();
    const includes = (endsWith: t.StringPath) => !!ls.find((p) => p.endsWith(endsWith));

    /**
     * Assertions:
     */
    {
      // Files created/modified exist at target; no initializer source persisted:
      const written = res.ops
        .filter((o) => o.kind === 'create' || o.kind === 'modify')
        .map((o) => o.path);

      expect(includes('/.tmpl.ts')).to.be.false; // ← should not include initializer file.

      for (const rel of written) {
        const abs = Fs.join(res.dir.target, rel);
        expect(await Fs.exists(abs)).to.eql(true, `missing written file: ${rel}`);
      }
    }

    {
      // Initializer updated package types barrel:
      const path = Fs.join(srcDir, 'types.ts');
      const types = (await Fs.readText(path)).data!;
      expect(types).to.include(`export type * from './m.MyModule/t.ts';`);
    }

    // Sanity: target directory exists in expected location within the package:
    expect(includes('/ns/my-module/src/m.MyModule/t.ts')).to.be.true;
  });
});
