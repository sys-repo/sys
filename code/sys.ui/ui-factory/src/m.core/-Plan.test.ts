import { type t, describe, expect, it, Obj, reg } from '../-test.ts';
import { Factory, Plan } from './mod.ts';

/**
 * Test domain unions:
 */
type Id = 'Layout:root' | 'Card:view' | 'List:view';
type Slot = 'Main' | 'Sidebar' | 'Item';

/**
 * Guardrail: ensure the factory preserved slots for a given id.
 */
const expectSlots = <I extends string, S extends string>(
  f: t.FactoryWithSlots<I, S>,
  id: I,
  slots: readonly S[],
) => expect((f.specs[id] as any).spec.slots).to.eql(slots);

describe('Plan', () => {
  describe('Plan.validate (canonical)', () => {
    it('accepts a valid canonical plan', () => {
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
        reg<Id, Slot>('Card:view', []),
        reg<Id, Slot>('List:view', ['Item']),
      ]) as t.FactoryWithSlots<Id, Slot>;

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
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main']),
        reg<Id, Slot>('Card:view', []),
      ]) as t.FactoryWithSlots<Id, Slot>;

      // Sanity check:
      expectSlots(f, 'Layout:root', ['Main']);

      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          slots: {
            Main: { component: 'Nope:view' as Id },
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
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main']), // Only "Main" allowed.
        reg<Id, Slot>('Card:view', []),
      ]) as t.FactoryWithSlots<Id, Slot>;

      // Sanity check:
      expectSlots(f, 'Layout:root', ['Main']);

      const plan: t.Plan<typeof f> = {
        root: {
          component: 'Layout:root',
          slots: {
            Sidebar: { component: 'Card:view' }, // Invalid.
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

  describe('Plan.validateLinear (id/slot/children)', () => {
    it('accepts a valid linear plan', () => {
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
        reg<Id, Slot>('Card:view', []),
        reg<Id, Slot>('List:view', ['Item']),
      ]) as t.FactoryWithSlots<Id, Slot>;

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

      const res = Plan.validateLinear(plan, f);
      expect(res.ok).to.eql(true);
      expect(plan).to.eql(beforePlan);
      expect(f.specs).to.eql(beforeSpecs);
    });

    it('allows missing slot when parent declares slots (default semantics)', () => {
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
        reg<Id, Slot>('Card:view', []),
      ]) as t.FactoryWithSlots<Id, Slot>;

      // sanity
      expectSlots(f, 'Layout:root', ['Main', 'Sidebar']);

      const plan: t.LinearPlan<Id, Slot> = {
        root: {
          id: 'Layout:root',
          children: [{ id: 'Card:view' }], // no slot → allowed by default semantics
        },
      };

      const res = Plan.validateLinear(plan, f);
      expect(res.ok).to.eql(true);
    });

    it('rejects unknown id (linear)', () => {
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main']),
        reg<Id, Slot>('Card:view', []),
      ]) as t.FactoryWithSlots<Id, Slot>;

      // sanity
      expectSlots(f, 'Layout:root', ['Main']);

      const plan: t.LinearPlan<Id, Slot> = {
        root: {
          id: 'Layout:root',
          children: [{ id: 'Nope:view' as Id, slot: 'Main' }],
        },
      };

      const res = Plan.validateLinear(plan, f);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.code).to.eql('UNKNOWN_VIEW_ID');
        expect(res.error.path).to.eql([0]);
      }
    });

    it('rejects invalid slot for given parent (linear)', () => {
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main']), // only "Main"
        reg<Id, Slot>('Card:view', []),
      ]) as t.FactoryWithSlots<Id, Slot>;

      // sanity
      expectSlots(f, 'Layout:root', ['Main']);

      const plan: t.LinearPlan<Id, Slot> = {
        root: {
          id: 'Layout:root',
          children: [{ id: 'Card:view', slot: 'Sidebar' }], // Invalid.
        },
      };

      const res = Plan.validateLinear(plan, f);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.code).to.eql('INVALID_SLOT');
        expect(res.error.allowed).to.eql(['Main']);
        expect(res.error.got).to.eql('Sidebar');
      }
    });
  });

  describe('Plan.fromLinear', () => {
    it('converts a valid linear plan into a canonical plan that validates', () => {
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
        reg<Id, Slot>('Card:view', []),
        reg<Id, Slot>('List:view', ['Item']),
      ]) as t.FactoryWithSlots<Id, Slot>;

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
      const canonical = Plan.fromLinear(linear, f);
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
      const f = Factory.make<Id>([
        reg<Id, Slot>('Layout:root', ['Main', 'Sidebar']),
        reg<Id, Slot>('Card:view', []),
      ]) as t.FactoryWithSlots<Id, Slot>;

      // Sanity check:
      expectSlots(f, 'Layout:root', ['Main', 'Sidebar']);

      const linear: t.LinearPlan<Id, Slot> = {
        root: {
          id: 'Layout:root',
          children: [{ id: 'Card:view' }], // Missing slot.
        },
      };

      const fn = () => Plan.fromLinear(linear, f, { placeUnslotted: 'reject' });
      expect(fn).to.throw();
    });
  });
});
