import React from 'react';

import { type t, describe, expect, it, Obj, TestReg } from '../-test.ts';
import { Factory, Plan } from '../m.core/mod.ts';
import { ReactPlanView } from './mod.ts';

type Id = 'Layout:root' | 'Card:view' | 'List:view';
type Slot = 'Main' | 'Sidebar' | 'Item';

describe.skip('ReactPlanView (façade)', () => {
  it('renders a resolved plan directly as React elements with slot props', async () => {
    // Factory:
    const layout = TestReg.make<Id, Slot>('Layout:root', ['Main', 'Sidebar']);
    const card = TestReg.make<Id, Slot>('Card:view', []);
    const list = TestReg.make<Id, Slot>('List:view', ['Item']);
    const f = Factory.make<Id>([layout, card, list]) as t.FactoryWithSlots<Id, Slot>;

    // Plan → canonical → resolved:
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

    // Façade element:
    const el = (<ReactPlanView resolved={resolved.root} />) as any;

    expect(React.isValidElement(el)).to.eql(true);
    expect(el.type).to.eql(ReactPlanView); // top-level is the façade
    // dive one: the façade renders the Layout component as its child
    const LayoutEl = el.props.children ?? React.createElement(el.type, el.props);
    // alternatively: render shape assertions by reading element constructed by façade:
    const LayoutTree = (el.props as any).children ?? null;

    // A simpler structural probe:
    // Render the façade one step: it should produce the Layout element with slot props.
    const LayoutDirect = (ReactPlanView as any)({ resolved: resolved.root }) as any;
    expect(LayoutDirect.type.displayName).to.eql('Layout:root');

    // Slots present with proper shapes:
    const main = LayoutDirect.props.Main;
    const sidebar = LayoutDirect.props.Sidebar;

    expect(React.isValidElement(main)).to.eql(true);
    expect(main.type.displayName).to.eql('Card:view');
    expect(main.props.x).to.eql(1);

    expect(Array.isArray(sidebar)).to.eql(true);
    expect(sidebar.length).to.eql(1);

    const listEl = sidebar[0];
    expect(listEl.type.displayName).to.eql('List:view');

    const items = listEl.props.Item;
    expect(Array.isArray(items)).to.eql(true);
    expect(items.length).to.eql(2);
    expect(items[0].type.displayName).to.eql('Card:view');
    expect(items[0].props.note).to.eql('A');
    expect(items[1].type.displayName).to.eql('Card:view');
    expect(items[1].props.note).to.eql('B');

    // Inputs not mutated:
    expect(resolved.root).to.eql(before);
  });
});
