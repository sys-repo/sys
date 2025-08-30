import { describe, expect, it } from '../-test.ts';
import { HarnessSchema, makePlan, regs } from './mod.ts';

describe('DevHarness', () => {
  describe('catalog (smoke-test)', () => {
    it('makePlan: root (no slots yet)', () => {
      const plan = makePlan();
      expect(plan.root.component).to.eql('Harness:view');
      expect(plan.root.slots).to.eql(undefined);
    });

    it('regs: contains Harness spec with left/right slots', () => {
      const reg = regs.find((r) => r.spec.id === 'Harness:view');
      expect(Boolean(reg)).to.eql(true);
      expect(reg!.spec.slots).to.eql(['left', 'right']);
    });

    it('regs.load(): yields a React component (default export)', async () => {
      const reg = regs.find((r) => r.spec.id === 'Harness:view')!;
      const mod = await reg.load();
      expect(typeof mod.default).to.eql('function');
      // Optional identity check (non-critical, but nice):
      // @ts-ignore name is not guaranteed across minifiers, keep as soft check.
      if ('name' in mod.default) expect(mod.default.name).to.eql('Harness');
    });

    it('schemas: HarnessSchema is an object schema', () => {
      expect(HarnessSchema.type).to.eql('object');
    });
  });
});
