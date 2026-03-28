import { describe, expect, it } from '../../../-test.ts';
import { Esm } from '../mod.ts';

describe('Esm', () => {
  describe('Esm.hasDefaultExport', () => {
    it('detects direct default exports', () => {
      expect(Esm.hasDefaultExport(`export default 'foo';\n`)).to.eql(true);
      expect(Esm.hasDefaultExport(`export default function foo() {}\n`)).to.eql(true);
    });

    it('detects default re-export forms', () => {
      expect(Esm.hasDefaultExport(`export { default } from './mod.ts';\n`)).to.eql(true);
      expect(Esm.hasDefaultExport(`export { foo as default };\n`)).to.eql(true);
      expect(Esm.hasDefaultExport(`export { foo as default } from './mod.ts';\n`)).to.eql(true);
      expect(Esm.hasDefaultExport(`export {\n  foo as default,\n  bar,\n} from './mod.ts';\n`)).to.eql(true);
    });

    it('ignores non-default export forms', () => {
      expect(Esm.hasDefaultExport(`export const foo = true;\n`)).to.eql(false);
      expect(Esm.hasDefaultExport(`export { default as foo } from './mod.ts';\n`)).to.eql(false);
      expect(Esm.hasDefaultExport(`export * from './mod.ts';\n`)).to.eql(false);
      expect(Esm.hasDefaultExport(`export type { default as Foo } from './mod.ts';\n`)).to.eql(false);
    });

    it('ignores comments and strings that only mention default exports', () => {
      expect(Esm.hasDefaultExport(`// export default 'nope';\nexport const foo = true;\n`)).to.eql(false);
      expect(Esm.hasDefaultExport(`/* export { foo as default } */\nexport const foo = true;\n`)).to.eql(false);
      expect(Esm.hasDefaultExport(`const value = 'export default nope';\nexport const foo = true;\n`)).to.eql(false);
      expect(Esm.hasDefaultExport('const value = `export { foo as default }`;\n')).to.eql(false);
    });
  });
});
