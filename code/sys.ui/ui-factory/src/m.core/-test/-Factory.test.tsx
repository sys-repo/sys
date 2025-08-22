import { type t, type TestModule, describe, expect, it, Obj, TestCore } from '../../-test.ts';
import { Factory } from '../mod.ts';

type Id = 'Alpha:view' | 'Beta:view';
type F = t.Factory<Id, t.Registration<Id, t.SlotId, TestModule>>;

describe('Factory', () => {
  describe('Factory.make', () => {
    it('creates a registry keyed by spec.id', async () => {
      const regs = [TestCore.Reg.make('Alpha:view'), TestCore.Reg.make('Beta:view')] as const;
      const f = Factory.make(regs); // ← let TS infer <Id, Reg>

      // `ids` present:
      expect(Object.keys(f.specs)).to.eql(['Alpha:view', 'Beta:view']);

      // `getView` resolves lazy bundle (ok: true):
      const alpha = await f.getView('Alpha:view' as Id);
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
      Factory.make(regs);
      expect(regs).to.eql(before);
    });
  });

  it('merges factories (left→right), later wins on collisions', async () => {
    const f1 = Factory.make([TestCore.Reg.make('Alpha:view')]) as F; // ← widen to Id union
    const f2 = Factory.make([TestCore.Reg.make('Beta:view')]) as F; //  ← widen to Id union

    // Collision: override "Alpha:view" with different loader (wins because right-most).
    const altAlpha: t.Registration<'Alpha:view', t.SlotId, TestModule> = {
      spec: { id: 'Alpha:view', slots: [] },
      load: async () => TestCore.View.stub('Alpha:view:ALT'),
    };

    const f3 = Factory.make([altAlpha]) as F; //      ← widen to Id union
    const merged = Factory.compose([f1, f2, f3]); //  ← ok: all inputs share F

    // All ids present:
    expect(Object.keys(merged.specs).sort()).to.eql(['Alpha:view', 'Beta:view']);

    // Precedence check:
    const alpha = await merged.getView('Alpha:view' as Id);
    expect(alpha.ok).to.eql(true);
    if (alpha.ok) {
      const mod = alpha.module as TestModule;
      const out = mod.default({ x: 1 });
      expect(out).to.eql({ name: 'Alpha:view:ALT', props: { x: 1 } });
    }
  });

  describe('Factory.compose', () => {
    it('returns a new factory without mutating inputs', () => {
      type F = t.Factory<Id, t.Registration<Id, t.SlotId, TestModule>>; //  ← shared widening

      const a = Factory.make([TestCore.Reg.make('Alpha:view')]) as F; //    ← widen to Id union
      const b = Factory.make([TestCore.Reg.make('Beta:view')]) as F; //     ← widen to Id union

      const beforeA = Obj.clone(a.specs);
      const beforeB = Obj.clone(b.specs);
      const merged = Factory.compose([a, b]); // OK: both are F

      // Identity checks remain intentional:
      expect(merged).to.not.equal(a);
      expect(merged).to.not.equal(b);

      // Verify no mutation of inputs:
      expect(a.specs).to.eql(beforeA);
      expect(b.specs).to.eql(beforeB);
    });
  });
});
