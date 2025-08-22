import { type t, type TestModule, describe, expect, it, Obj, TestCore } from '../-test.ts';
import { Factory } from './mod.ts';

type Id = 'Alpha:view' | 'Beta:view';

describe('Factory', () => {
  describe('Factory.make', () => {
    it('creates a registry keyed by spec.id', async () => {
      const regs = [TestCore.Reg.make('Alpha:view'), TestCore.Reg.make('Beta:view')] as const;
      const f = Factory.make<Id>(regs);

      // `ids` present:
      expect(Object.keys(f.specs)).to.eql(['Alpha:view', 'Beta:view']);

      // `getView` resolves lazy bundle (ok: true):
      const alpha = await f.getView('Alpha:view');
      expect(alpha.ok).to.eql(true);
      if (alpha.ok) {
        const mod = alpha.module as TestModule; // adapter-agnostic cast
        const out = mod.default({ x: 1 });
        expect(out).to.eql({ name: 'Alpha:view', props: { x: 1 } });
      }

      // <unknown> id → ok: false (no throw):
      const nope = await f.getView('Nope:view' as Id);
      expect(nope.ok).to.eql(false);
      if (!nope.ok) expect(nope.error.message).to.eql("Unknown view id: 'Nope:view'");
    });

    it('does not mutate input registrations', () => {
      const regs = [TestCore.Reg.make('Alpha:view')];
      const before = Obj.clone(regs);
      Factory.make<Id>(regs as any);
      expect(regs).to.eql(before);
    });
  });

  describe('Factory.compose', () => {
    it('merges factories (left→right), later wins on collisions', async () => {
      const f1 = Factory.make<Id>([TestCore.Reg.make('Alpha:view')]);
      const f2 = Factory.make<Id>([TestCore.Reg.make('Beta:view')]);

      // Collision: override "Alpha:view" with different loader (wins because right-most).
      const altAlpha: t.Registration<'Alpha:view', t.SlotId, TestModule> = {
        spec: { id: 'Alpha:view', slots: [] },
        load: async () => TestCore.View.stub('Alpha:view:ALT'),
      };
      const f3 = Factory.make<Id>([altAlpha]);
      const merged = Factory.compose<Id>([f1, f2, f3]);

      // All ids present:
      expect(Object.keys(merged.specs).sort()).to.eql(['Alpha:view', 'Beta:view']);

      // Precedence check:
      const alpha = await merged.getView('Alpha:view');
      expect(alpha.ok).to.eql(true);
      if (alpha.ok) {
        const mod = alpha.module as TestModule; // adapter-agnostic cast
        const out = mod.default({ x: 1 });
        expect(out).to.eql({ name: 'Alpha:view:ALT', props: { x: 1 } });
      }
    });

    it('returns a new factory without mutating inputs', () => {
      const a = Factory.make<Id>([TestCore.Reg.make('Alpha:view')]);
      const b = Factory.make<Id>([TestCore.Reg.make('Beta:view')]);

      const beforeA = Obj.clone(a.specs);
      const beforeB = Obj.clone(b.specs);
      const merged = Factory.compose<Id>([a, b]);

      // Identity checks remain intentional:
      expect(merged).to.not.equal(a);
      expect(merged).to.not.equal(b);

      // Verify no mutation of inputs:
      expect(a.specs).to.eql(beforeA);
      expect(b.specs).to.eql(beforeB);
    });
  });
});
