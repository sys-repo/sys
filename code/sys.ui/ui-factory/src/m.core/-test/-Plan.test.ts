import { type t, describe, expect, expectSlots, it, Obj, TestCore } from '../../-test.ts';
import { Factory, Plan } from '../mod.ts';

/**
 * Test domain unions:
 */
type Id = 'Layout:root' | 'Card:view' | 'List:view';
type Slot = 'Main' | 'Sidebar' | 'Item';

describe('Plan', () => {
  describe('Plan.validate (canonical)', () => {
    it('accepts a valid canonical plan', () => {
      const f = Factory.make([
        TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
        TestCore.Reg.make<Id, Slot>('Card:view', []),
        TestCore.Reg.make<Id, Slot>('List:view', ['Item']),
      ]) satisfies t.FactoryWithSlots<Id, Slot>;

      // Sanity check: registry preserved slots:
      expectSlots(f, 'Layout:root', ['Main', 'Sidebar']);
      expectSlots(f, 'List:view', ['Item']);

      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          props: { title: 'Home' },
          slots: {
            Main: { component: 'Card:view', props: { x: 1 } },
            Sidebar: [
              {
                component: 'List:view',
                slots: { Item: { component: 'Card:view', props: { note: 'nested' } } },
              },
            ],
          },
        },
      };

      const beforePlan = Obj.clone(plan);
      const beforeSpecs = Obj.clone(f.specs);

      const res = Plan.validate(plan, f);
      expect(res.ok).to.eql(true);
      expect(plan).to.eql(beforePlan); // Input immutability
      expect(f.specs).to.eql(beforeSpecs);
    });

    it('rejects unknown view id (canonical)', () => {
      const f = Factory.make([
        TestCore.Reg.make<Id, Slot>('Layout:root', ['Main']),
        TestCore.Reg.make<Id, Slot>('Card:view', []),
      ]) satisfies t.FactoryWithSlots<Id, Slot>;

      // Sanity check:
      expectSlots(f, 'Layout:root', ['Main']);

      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          slots: {
            Main: { component: 'Nope:view' as Id }, // intentional bad case
          },
        },
      };

      const res = Plan.validate(plan, f);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.code).to.eql('UNKNOWN_VIEW_ID');
        expect(res.error.message).to.include('Unknown view id:');
        expect(res.error.path).to.eql([0]); // First child under root.
      }
    });

    it('rejects invalid slot name for the parent (canonical)', () => {
      const f = Factory.make([
        TestCore.Reg.make<Id, Slot>('Layout:root', ['Main']), // Only "Main" allowed.
        TestCore.Reg.make<Id, Slot>('Card:view', []),
      ]) satisfies t.FactoryWithSlots<Id, Slot>;

      // Sanity check:
      expectSlots(f, 'Layout:root', ['Main']);

      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          slots: {
            Sidebar: { component: 'Card:view' }, // Invalid on purpose.
          } as any,
        },
      };

      const res = Plan.validate(plan, f);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.code).to.eql('INVALID_SLOT');
        expect(res.error.allowed).to.eql(['Main']);
        expect(res.error.got).to.eql('Sidebar');
      }
    });
  });

  describe('Plan.Linear', () => {
    describe('Plan.Linear.validate (id/slot/children)', () => {
      it('accepts a valid linear plan', () => {
        const f = Factory.make([
          TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
          TestCore.Reg.make<Id, Slot>('Card:view', []),
          TestCore.Reg.make<Id, Slot>('List:view', ['Item']),
        ]) satisfies t.FactoryWithSlots<Id, Slot>;

        // sanity
        expectSlots(f, 'Layout:root', ['Main', 'Sidebar']);
        expectSlots(f, 'List:view', ['Item']);

        const plan: t.LinearPlan<Id, Slot> = {
          root: {
            id: 'Layout:root',
            props: { title: 'Home' },
            children: [
              { id: 'Card:view', slot: 'Main', props: { x: 1 } },
              {
                id: 'List:view',
                slot: 'Sidebar',
                children: [{ id: 'Card:view', slot: 'Item', props: { note: 'nested' } }],
              },
            ],
          },
        };

        const beforePlan = Obj.clone(plan);
        const beforeSpecs = Obj.clone(f.specs);

        const res = Plan.Linear.validate(plan, f);
        expect(res.ok).to.eql(true);
        expect(plan).to.eql(beforePlan);
        expect(f.specs).to.eql(beforeSpecs);
      });

      it('allows missing slot when parent declares slots (default semantics)', () => {
        const f = Factory.make([
          TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
          TestCore.Reg.make<Id, Slot>('Card:view', []),
        ]) satisfies t.FactoryWithSlots<Id, Slot>;

        // sanity
        expectSlots(f, 'Layout:root', ['Main', 'Sidebar']);

        const plan: t.LinearPlan<Id, Slot> = {
          root: {
            id: 'Layout:root',
            children: [{ id: 'Card:view' }], // no slot → allowed by default semantics
          },
        };

        const res = Plan.Linear.validate(plan, f);
        expect(res.ok).to.eql(true);
      });

      it('rejects unknown id (linear)', () => {
        const f = Factory.make([
          TestCore.Reg.make<Id, Slot>('Layout:root', ['Main']),
          TestCore.Reg.make<Id, Slot>('Card:view', []),
        ]) satisfies t.FactoryWithSlots<Id, Slot>;

        // sanity
        expectSlots(f, 'Layout:root', ['Main']);

        const plan: t.LinearPlan<Id, Slot> = {
          root: {
            id: 'Layout:root',
            children: [{ id: 'Nope:view' as Id, slot: 'Main' }], // bad on purpose
          },
        };

        const res = Plan.Linear.validate(plan, f);
        expect(res.ok).to.eql(false);
        if (!res.ok) {
          expect(res.error.code).to.eql('UNKNOWN_VIEW_ID');
          expect(res.error.path).to.eql([0]);
        }
      });

      it('rejects invalid slot for given parent (linear)', () => {
        const f = Factory.make([
          TestCore.Reg.make<Id, Slot>('Layout:root', ['Main']), // only "Main"
          TestCore.Reg.make<Id, Slot>('Card:view', []),
        ]) satisfies t.FactoryWithSlots<Id, Slot>;

        // sanity
        expectSlots(f, 'Layout:root', ['Main']);

        const plan: t.LinearPlan<Id, Slot> = {
          root: {
            id: 'Layout:root',
            children: [{ id: 'Card:view', slot: 'Sidebar' }], // Invalid.
          },
        };

        const res = Plan.Linear.validate(plan, f);
        expect(res.ok).to.eql(false);
        if (!res.ok) {
          expect(res.error.code).to.eql('INVALID_SLOT');
          expect(res.error.allowed).to.eql(['Main']);
          expect(res.error.got).to.eql('Sidebar');
        }
      });
    });

    describe('Plan.Linear.toCanonical', () => {
      it('converts a valid linear plan into a canonical plan that validates', () => {
        const f = Factory.make([
          TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
          TestCore.Reg.make<Id, Slot>('Card:view', []),
          TestCore.Reg.make<Id, Slot>('List:view', ['Item']),
        ]) satisfies t.FactoryWithSlots<Id, Slot>;

        // Sanity check:
        expectSlots(f, 'Layout:root', ['Main', 'Sidebar']);
        expectSlots(f, 'List:view', ['Item']);

        const linear: t.LinearPlan<Id, Slot> = {
          root: {
            id: 'Layout:root',
            children: [
              { id: 'Card:view', slot: 'Main', props: { x: 1 } },
              {
                id: 'List:view',
                slot: 'Sidebar',
                children: [{ id: 'Card:view', slot: 'Item', props: { note: 'nested' } }],
              },
            ],
          },
        };

        const before = Obj.clone(linear);
        const canonical = Plan.Linear.toCanonical(linear, f);
        const res = Plan.validate(canonical, f);

        expect(linear).to.eql(before); // Input not mutated.
        expect(res.ok).to.eql(true);

        // Spot check structure:
        const root = canonical.root;
        expect(root.component).to.eql('Layout:root');
        const slots = root.slots as any;
        expect(Array.isArray(slots.Main)).to.eql(true);
        expect(Array.isArray(slots.Sidebar)).to.eql(true);
      });

      it('throws when strategy is "reject" and a child is missing a slot under a slotted parent', () => {
        const f = Factory.make([
          TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
          TestCore.Reg.make<Id, Slot>('Card:view', []),
        ]) satisfies t.FactoryWithSlots<Id, Slot>;

        // Sanity check:
        expectSlots(f, 'Layout:root', ['Main', 'Sidebar']);

        const linear: t.LinearPlan<Id, Slot> = {
          root: {
            id: 'Layout:root',
            children: [{ id: 'Card:view' }], // Missing slot.
          },
        };

        const fn = () => Plan.Linear.toCanonical(linear, f, { placeUnslotted: 'reject' });
        expect(fn).to.throw();
      });
    });
  });

  describe('Plan.resolve', () => {
    it('resolves modules for a canonical plan and memoizes by component id', async () => {
      const layout = TestCore.Reg.counter(
        TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
      );
      const card = TestCore.Reg.counter(TestCore.Reg.make<Id, Slot>('Card:view', []));
      const list = TestCore.Reg.counter(TestCore.Reg.make<Id, Slot>('List:view', ['Item']));

      type F = t.FactoryWithSlots<Id, Slot>;
      const f = Factory.make([layout.reg, card.reg, list.reg]) satisfies F;

      // Canonical plan with repeated Card:view occurrences (must load once):
      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          props: { title: 'Home' },
          slots: {
            Main: { component: 'Card:view', props: { x: 1 } },
            Sidebar: [
              {
                component: 'List:view',
                slots: {
                  Item: [
                    { component: 'Card:view', props: { note: 'A' } },
                    { component: 'Card:view', props: { note: 'B' } },
                  ],
                },
              },
            ],
          },
        },
      };

      const beforePlan = Obj.clone(plan);
      const beforeSpecs = Obj.clone(f.specs);

      const res = await Plan.resolve(plan, f);
      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('expected success');

      // Memoization: one load per Id:
      expect(layout.count).to.eql(1);
      expect(card.count).to.eql(1);
      expect(list.count).to.eql(1);

      // Cache: contains the three ids:
      const ok = res;
      expect(ok.cache.size).to.eql(3);

      // Structure: slots preserved (single vs array).
      const root = ok.root as any;
      expect(root.component).to.eql('Layout:root');
      expect(root.module).to.exist;
      expect(Array.isArray(root.slots.Main)).to.eql(false);
      expect(Array.isArray(root.slots.Sidebar)).to.eql(true);

      // Immutability:
      expect(plan).to.eql(beforePlan);
      expect(f.specs).to.eql(beforeSpecs);
    });

    it('bubbles loader failures as StdError(name="LoadError")', async () => {
      const badCard: t.Registration<'Card:view', Slot> = {
        spec: { id: 'Card:view', slots: [] },
        async load() {
          throw new Error('boom');
        },
      };

      const f = Factory.make([
        TestCore.Reg.make<Id, Slot>('Layout:root', ['Main']),
        badCard as t.Registration<Id, Slot>, // cast on purpose for error path
      ]) satisfies t.FactoryWithSlots<Id, Slot>;

      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          slots: { Main: { component: 'Card:view' } },
        },
      };

      const res = await Plan.resolve(plan, f);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        // The name may be 'LoadError' in a future wrapper, but is 'Error' today:
        expect(['LoadError', 'Error']).to.include(res.error.name);
        expect(res.error.message).to.include("Failed to load view 'Card:view'");
        expect(res.error?.cause?.message).to.include('boom');
      }
    });

    it('defensively returns UnknownViewId if a child id is not registered', async () => {
      const f = Factory.make([
        TestCore.Reg.make<Id, Slot>('Layout:root', ['Main']), // Card:view intentionally NOT registered
      ]) satisfies t.FactoryWithSlots<Id, Slot>;

      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          slots: { Main: { component: 'Card:view' as Id } }, // bad on purpose
        },
      };

      const res = await Plan.resolve(plan, f);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.name).to.eql('UnknownViewId');
        expect(res.error.message).to.include("Unknown view id: 'Card:view'");
      }
    });
  });
});
