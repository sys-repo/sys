import { type t, c, describe, it, expect, Testing, pkg } from '../../-test.ts';
import { Tmpl } from '../mod.ts';

describe(`${pkg.name}/fs: Tmpl`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/fs');
    expect(m.Tmpl).to.equal(Tmpl);
  });

  describe('Tmpl:Catalog', () => {
    it('sample', async () => {
      // Create a module-local temp dir (eg: <module>/.tmp):
      const fs = Testing.dir('.tmp', { slug: true });
      const target = `${fs.dir}/catalog` as t.StringDir;

      const res = await Tmpl.writeCatalog(target, {
        write: { dryRun: false },
        factory: {
          processFile(e) {
            console.log('e', e);
          },
        },
      });

      // Basic shape:
      expect(res.ops.length > 0).to.be.true;

      // Helper: find an op by target-path suffix.
      const find = (suffix: string) => res.ops.find((o) => String(o.file.target).endsWith(suffix));

      // Expected files created:
      expect(find('catalog/ui/Hello/schema.ts')?.created).to.be.true;
      expect(find('catalog/ui/Hello/spec.ts')?.created).to.be.true;
      expect(find('catalog/ui/Hello/ui.tsx')?.created).to.be.true;
      expect(find('catalog/ui/Hello/mod.ts')?.created).to.be.true;
      expect(find('catalog/regs.ts')?.created).to.be.true;
      expect(find('catalog/plans.ts')?.created).to.be.true;
      expect(find('catalog/mod.ts')?.created).to.be.true;

      // Pretty table (trim left to keep readable):
      const table = Tmpl.table(res.ops, { trimPathLeft: fs.dir });

      // Print:
      console.info(c.gray(`-tmpl/catalog/*`));
      console.info();
      console.info(c.bold(c.cyan(`Catalog Scaffold`)));
      console.info();
      console.info(table);
      console.info();
    });
  });
});
