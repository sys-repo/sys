import { type t, describe, expect, it, Obj, TestCore } from '../../-test.ts';
import { Factory, Plan, Renderer } from '../mod.ts';

type Id = 'Layout:root' | 'Card:view' | 'List:view';
type Slot = 'Main' | 'Sidebar' | 'Item';

describe('Renderer', () => {
  it('mount: creates nodes depth-first and inserts by slot (preserving order)', async () => {
    // Factory with views:
    const layout = TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']);
    const card = TestCore.Reg.make<Id, Slot>('Card:view', []);
    const list = TestCore.Reg.make<Id, Slot>('List:view', ['Item']);

    // Let inference carry Id/Slot unions, but require the slot contract to be present.
    const f = Factory.make([layout, card, list]) satisfies t.FactoryWithSlots<Id, Slot>;

    // Plan → Resolved:
    const linear: t.LinearPlan<Id, Slot> = {
      root: {
        id: 'Layout:root',
        children: [
          { id: 'Card:view', slot: 'Main', props: { x: 1 } },
          {
            id: 'List:view',
            slot: 'Sidebar',
            children: [
              { id: 'Card:view', slot: 'Item', props: { note: 'A' } },
              { id: 'Card:view', slot: 'Item', props: { note: 'B' } },
            ],
          },
        ],
      },
    };

    const canonical = Plan.Linear.toCanonical(linear, f);
    const beforeResolved = Obj.clone(canonical);

    const resolved = await Plan.resolve(canonical, f);
    expect(resolved.ok).to.eql(true);
    if (!resolved.ok) throw new Error('expected ok');
    const rootResolved = resolved.root;

    // Fake host adapter that records calls:
    type NodeRec = { id: string; props?: unknown };
    const createLog: string[] = [];
    const insertLog: Array<{ parent: string; slot: string; count: number; ids: string[] }> = [];

    const nodeLabel = (n: t.ResolvedPlanNode<typeof f>): string => n.component as string;

    const adapter: t.HostAdapter<typeof f> = {
      create(node) {
        createLog.push(nodeLabel(node));
        return { id: nodeLabel(node), props: node.props } as NodeRec;
      },
      insert(parent, slot, child) {
        const arr = Array.isArray(child) ? child : [child];
        const ids = arr.map((c: any) => c.id);
        insertLog.push({ parent: (parent as any).id, slot, count: arr.length, ids });
      },
      remove(_node) {
        /* noop for this test */
      },
      finalize(root) {
        return { root } as unknown as t.HostInstance;
      },
    };

    // Mount:
    const instance = Renderer.mount(rootResolved, adapter);

    // Create order is depth-first (pre-order):
    expect(createLog).to.eql([
      'Layout:root',
      'Card:view', // Main
      'List:view', // Sidebar
      'Card:view', // Item (A)
      'Card:view', // Item (B)
    ]);

    // Insert calls per slot, preserving order within arrays:
    expect(insertLog).to.eql([
      { parent: 'Layout:root', slot: 'Main', count: 1, ids: ['Card:view'] },
      { parent: 'List:view', slot: 'Item', count: 2, ids: ['Card:view', 'Card:view'] }, // before Sidebar insert
      { parent: 'Layout:root', slot: 'Sidebar', count: 1, ids: ['List:view'] },
    ]);

    // Immutability:
    expect(canonical).to.eql(beforeResolved);
    expect(instance).to.exist;
  });

  it('unmount: removes in post-order (children before parent)', async () => {
    // Factory & resolved plan:
    const layout = TestCore.Reg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']);
    const card = TestCore.Reg.make<Id, Slot>('Card:view', []);
    const list = TestCore.Reg.make<Id, Slot>('List:view', ['Item']);
    const f = Factory.make([layout, card, list]) satisfies t.FactoryWithSlots<Id, Slot>;

    const linear: t.LinearPlan<Id, Slot> = {
      root: {
        id: 'Layout:root',
        children: [
          { id: 'Card:view', slot: 'Main' },
          {
            id: 'List:view',
            slot: 'Sidebar',
            children: [
              { id: 'Card:view', slot: 'Item', props: { note: 'A' } },
              { id: 'Card:view', slot: 'Item', props: { note: 'B' } },
            ],
          },
        ],
      },
    };

    const canonical = Plan.Linear.toCanonical(linear, f);
    const resolved = await Plan.resolve(canonical, f);
    expect(resolved.ok).to.eql(true);
    if (!resolved.ok) throw new Error('expected ok');
    const rootResolved = resolved.root;

    // Adapter that records removals (we only care about remove order here):
    const removeLog: string[] = [];
    const label = (n: any): string => n.id;

    const adapter: t.HostAdapter<typeof f> = {
      create(node) {
        return { id: node.component as string };
      },
      insert() {
        /* no-op */
      },
      remove(node) {
        removeLog.push(label(node));
      },
      finalize(root) {
        return { root } as unknown as t.HostInstance;
      },
    };

    // Mount + Unmount:
    const instance = Renderer.mount(rootResolved, adapter);
    Renderer.unmount(instance, adapter);

    // Expected post-order:
    // - Item children of List (two Cards)
    // - List itself
    // - Main Card
    // - Root Layout
    expect(removeLog).to.eql([
      'Card:view', // Item A
      'Card:view', // Item B
      'List:view',
      'Card:view', // Main
      'Layout:root',
    ]);
  });
});
