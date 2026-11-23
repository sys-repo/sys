import { Spinners } from '@sys/ui-components/react/spinners';
import { describe, EsmAssert, expect, it, Obj, Path } from '../../../-test.ts';

describe('Spinners exports', () => {
  for (const [kind, sibling] of [['Bar', 'Circular'], ['Circular', 'Bar']] as const) {
    it(`${kind} leaf → only its owner, without the family or ${sibling}`, async () => {
      const canonical = `@sys/ui-components/react/spinners/${kind.toLowerCase()}`;

      const owner = await import(canonical);
      const name = `${kind}Spinner`;
      expect(Obj.keys(owner)).to.eql([name]);
      expect(owner[name].UI).to.equal(Spinners[kind]);

      await EsmAssert.runtimeGraphBoundary({
        entry: Path.fromFileUrl(import.meta.resolve(canonical)),
        forbiddenPathIncludes: ['/ui/Spinners/', `/ui/Spinners.${sibling}/`],
        forbiddenImports: ['@sys/ui-components/react/spinners', '@sys/ui-components/spinners'],
      });
    });
  }
});
