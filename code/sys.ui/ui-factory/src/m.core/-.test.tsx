import React from 'react';
import { type t, describe, expect, it, Obj } from '../-test.ts';
import { Factory } from './mod.ts';

type Id = 'Alpha:view' | 'Beta:view';

describe('Factory (core)', () => {
  it('API', async () => {
    const m1 = await import('@sys/ui-factory');
    const m2 = await import('@sys/ui-factory/core');
    expect(m1.Factory).to.equal(Factory);
    expect(m2.Factory).to.equal(Factory);
  });

  describe('Factory.make', () => {
    it('creates a registry keyed by spec.id', async () => {
      const regs = [reg('Alpha:view'), reg('Beta:view')] as const;
      const f = Factory.make<Id>(regs);

      // `ids` present:
      expect(Object.keys(f.specs)).to.eql(['Alpha:view', 'Beta:view']);

      // `getView` resolves lazy bundle (ok: true):
      const alpha = await f.getView('Alpha:view');
      expect(alpha.ok).to.eql(true);
      if (alpha.ok) {
        const Comp: React.FC<any> = alpha.module.default;
        const el = Comp({ x: 1 });

        // Narrow ReactNode → ReactElement
        expect(React.isValidElement(el)).to.eql(true);
        if (React.isValidElement(el)) {
          expect(el.type).to.eql('div');
          const props: any = el.props;
          expect(props['data-stub-view']).to.eql('Alpha:view');
          expect(JSON.parse(props['data-props'])).to.eql({ x: 1 });
        }
      }

      // <unknown> id → ok: false (no throw):
      const nope = await f.getView('Nope:view' as Id);
      expect(nope.ok).to.eql(false);
      if (!nope.ok) expect(nope.error.message).to.eql("Unknown view id: 'Nope:view'");
    });

    it('does not mutate input registrations', () => {
      const regs = [reg('Alpha:view')];
      const before = Obj.clone(regs);
      Factory.make<Id>(regs as any);
      expect(regs).to.eql(before);
    });
  });

  describe('Factory.compose', () => {
    it('merges factories (left→right), later wins on collisions', async () => {
      const f1 = Factory.make<Id>([reg('Alpha:view')]);
      const f2 = Factory.make<Id>([reg('Beta:view')]);

      // Collision: override "Alpha:view" with different loader (wins because right-most).
      const altAlpha: t.Registration<'Alpha:view'> = {
        spec: { id: 'Alpha:view', slots: [] },
        load: async () => stubView('Alpha:view:ALT'),
      };
      const f3 = Factory.make<Id>([altAlpha]);
      const merged = Factory.compose<Id>([f1, f2, f3]);

      // All ids present:
      expect(Object.keys(merged.specs).sort()).to.eql(['Alpha:view', 'Beta:view']);

      // Precedence check:
      const alpha = await merged.getView('Alpha:view');
      expect(alpha.ok).to.eql(true);
      if (alpha.ok) {
        const Comp: React.FC<any> = alpha.module.default;
        const el = Comp({ x: 1 });

        // Narrow ReactNode → ReactElement
        expect(React.isValidElement(el)).to.eql(true);
        if (React.isValidElement(el)) {
          expect(el.type).to.eql('div');
          const props: any = el.props;
          expect(props['data-stub-view']).to.eql('Alpha:view:ALT');
          expect(JSON.parse(props['data-props'])).to.eql({ x: 1 });
        }
      }
    });

    it('returns a new factory without mutating inputs', () => {
      const a = Factory.make<Id>([reg('Alpha:view')]);
      const b = Factory.make<Id>([reg('Beta:view')]);

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

/**
 * Helpers:
 */

/** Silent stub: renders a React element with testable attrs. */
export const stubView = (name: string): t.LazyViewModule => {
  const Comp: React.FC<unknown> = (props) => (
    <div data-stub-view={name} data-props={JSON.stringify(props)} />
  );
  (Comp as any).displayName = name;
  return { default: Comp };
};

const reg = <T extends Id>(id: T): t.Registration<T> => {
  return {
    spec: { id, slots: [] },
    load: async () => stubView(id),
  };
};
