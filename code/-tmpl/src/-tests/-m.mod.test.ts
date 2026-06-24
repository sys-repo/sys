import { updateTypesFile } from '../../-templates/tmpl.m.mod/.tmpl.ts';
import { type t, describe, expect, Fs, it, makeTmpl, Str, Templates } from '../-test.ts';
import { logTemplate, makeWorkspaceWithPkg } from './u.ts';

describe('Template: m.mod', () => {
  describe('write', () => {
    it('runs CLI flow', async () => {
      /**
       * Workspace + pkg scaffold (pkg already applied):
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

  describe('updateTypesFile', () => {
    const typeSource = (text: string) => `${Str.dedent(text)}\n`;

    it('preserves aggregate → adds leaf export once', async () => {
      const test = await makeTypesUpdateTarget(
        typeSource(`
          export type * from './ui.react/t.ts';
        `),
        'ui.react/ui.files/ui.InfoPanel.Config',
      );

      await updateTypesFile(test.targetDir);
      await updateTypesFile(test.targetDir);

      expect(await test.readTypes()).to.eql(typeSource(`
        export type * from './ui.react/t.ts';
        export type * from './ui.react/ui.files/ui.InfoPanel.Config/t.ts';
      `));
    });

    it('appends export when no star exports exist', async () => {
      const test = await makeTypesUpdateTarget(
        typeSource(`
          /**
           * @module types
           */
        `),
        'm.DocOnly',
      );

      await updateTypesFile(test.targetDir);

      expect(await test.readTypes()).to.eql(typeSource(`
        /**
         * @module types
         */
        export type * from './m.DocOnly/t.ts';
      `));
    });

    it('replaces inert placeholder export cleanly', async () => {
      const test = await makeTypesUpdateTarget(
        typeSource(`
          /**
           * @module types
           */
          export type {};
        `),
        'm.Placeholder',
      );

      await updateTypesFile(test.targetDir);

      expect(await test.readTypes()).to.eql(typeSource(`
        /**
         * @module types
         */
        export type * from './m.Placeholder/t.ts';
      `));
    });

    it('writes empty type surface as a single export', async () => {
      const test = await makeTypesUpdateTarget('  \n\n', 'm.Empty');

      await updateTypesFile(test.targetDir);

      expect(await test.readTypes()).to.eql(`export type * from './m.Empty/t.ts';\n`);
    });

    /**
     * Helpers:
     */
    async function makeTypesUpdateTarget(typesText: string, moduleRel: t.StringPath) {
      const test = await makeWorkspaceWithPkg('ns', 'my-module', '@my-scope/foo');
      const srcDir = Fs.join(test.pkgDir, 'src');
      const typesPath = Fs.join(srcDir, 'types.ts');
      const targetDir = Fs.join(srcDir, moduleRel);

      await Fs.write(typesPath, typesText, { force: true });
      await Fs.ensureDir(targetDir);

      const readTypes = async () => {
        const res = await Fs.readText(typesPath);
        if (res.error) throw res.error;
        return res.data ?? '';
      };

      return { targetDir, readTypes } as const;
    }
  });
});
