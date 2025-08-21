import React from 'react';

import { type t, describe, expect, it, Obj, TestReg } from '../-test.ts';
import { Factory, Plan, Renderer } from '../m.core/mod.ts';
import { ReactHostAdapter } from './mod.ts';

type Id = 'Layout:root' | 'Card:view' | 'List:view';
type Slot = 'Main' | 'Sidebar' | 'Item';

describe('ReactHostAdapter', () => {
  it('produces a React element; slots map to props (singleton vs array); inputs not mutated', async () => {
    // Factory:
    const layout = TestReg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']);
    const card = TestReg.make<Id, Slot>('Card:view', []);
    const list = TestReg.make<Id, Slot>('List:view', ['Item']);
    const f = Factory.make<Id>([layout, card, list]) as t.FactoryWithSlots<Id, Slot>;

    // plan → canonical → resolved
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
    const resolved = await Plan.resolve(canonical, f);
    expect(resolved.ok).to.eql(true);
    if (!resolved.ok) throw new Error('expected ok');

    const before = Obj.clone(resolved.root);

    // mount via adapter
    const adapter = ReactHostAdapter<typeof f>();
    const host = Renderer.mount(resolved.root, adapter) as unknown as {
      element: React.ReactElement;
    };

    // element validity (root)
    expect(React.isValidElement(host.element)).to.eql(true);

    // top-level component and slot props
    const rootEl = host.element as any;
    expect(rootEl?.type?.displayName).to.eql('Layout:root');

    const main = rootEl.props.Main;
    const sidebar = rootEl.props.Sidebar;

    // MAIN: always array (even with a single child)
    expect(Array.isArray(main)).to.eql(true);
    expect(main.length).to.eql(1);
    const mainEl = main[0];
    expect(typeof mainEl).to.eql('object');
    expect(mainEl?.type?.displayName).to.eql('Card:view');
    expect(mainEl?.props?.x).to.eql(1);

    // SIDEBAR: array with a List element
    expect(Array.isArray(sidebar)).to.eql(true);
    expect(sidebar.length).to.eql(1);

    const listEl = sidebar[0];
    expect(typeof listEl).to.eql('object');
    expect(listEl?.type?.displayName).to.eql('List:view');

    // Items: always array
    const items = listEl.props.Item;
    expect(Array.isArray(items)).to.eql(true);
    expect(items.length).to.eql(2);
    expect(items[0]?.type?.displayName).to.eql('Card:view');
    expect(items[0]?.props?.note).to.eql('A');
    expect(items[1]?.type?.displayName).to.eql('Card:view');
    expect(items[1]?.props?.note).to.eql('B');

    // Inputs not mutated:
    expect(resolved.root).to.eql(before);
  });

  it('adapter.update/remove are no-ops in v1 (do not throw)', () => {
    // Minimal smoke to ensure method futures are callable.
    const adapter = ReactHostAdapter<any>();
    adapter.update?.({} as t.HostNode, { any: 1 });
    adapter.remove({} as t.HostNode);
    expect(true).to.eql(true);
  });
});
