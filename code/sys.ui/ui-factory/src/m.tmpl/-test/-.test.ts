import { type t, c, describe, expect, it, pkg, Testing } from '../../-test.ts';
import { Tmpl } from '../mod.ts';

describe(`${pkg.name}/fs: Tmpl`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/tmpl');
    expect(m.Tmpl).to.equal(Tmpl);
    expect(m.default).to.equal(Tmpl);
  });

  describe('Tmpl:Catalog', () => {
    it('sample', async () => {
      const fs = Testing.dir('.tmp', { slug: true });
      const target = `${fs.dir}/catalog` as t.StringDir;

      const res = await Tmpl.write(target, { dryRun: false });

      // Basic shape:
      expect(res.ops.length > 0).to.be.true;

      // Helper: find an op by target-path suffix.
      const find = (suff: string) => res.ops.find((o) => o.file.target.toString().endsWith(suff));

      // Expected files created:
      expect(find('catalog/ui/Hello/schema.ts')?.created).to.be.true;
      expect(find('catalog/ui/Hello/spec.ts')?.created).to.be.true;
      expect(find('catalog/ui/Hello/ui.tsx')?.created).to.be.true;
      expect(find('catalog/ui/Hello/mod.ts')?.created).to.be.true;
      expect(find('catalog/def/regs.ts')?.created).to.be.true;
      expect(find('catalog/def/plan.ts')?.created).to.be.true;
      expect(find('catalog/def/mod.ts')?.created).to.be.true;

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
