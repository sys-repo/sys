import React from 'react';
import { type t, describe, expect, it } from '../../-test.ts';

import { HostAdapter } from '../mod.ts';
import { asReactInstance } from '../u.ts';

// Narrow a ReactFactory for good type flow in ResolvedPlanNode
type Id = 'A:view' | 'B:view' | 'C:view';
type Slot = 'Main' | 'List';
type F = t.ReactFactory<Id, Slot>;

describe('React: HostAdapter', () => {
  it('create → finalize: root element with props (no slots)', () => {
    const resolvedRoot: t.ResolvedPlanNode<F> = {
      component: 'A:view',
      props: { x: 1 },
      module: mod('A:view'),
    };

    const node = HostAdapter.create(resolvedRoot);
    const inst = HostAdapter.finalize(node);
    const { element } = asReactInstance(inst);

    expect(React.isValidElement(element)).to.eql(true);

    const Comp = (resolvedRoot.module as t.ReactModule).default;
    expect((element as any).type).to.equal(Comp);
    expect((element as any).props.x).to.equal(1);
  });

  it('insert: singleton child in a named slot', () => {
    const parentR: t.ResolvedPlanNode<F> = {
      component: 'A:view',
      props: { p: true },
      module: mod('A:view'),
    };
    const childR: t.ResolvedPlanNode<F> = {
      component: 'B:view',
      props: { c: 42 },
      module: mod('B:view'),
    };

    const parent = HostAdapter.create(parentR);
    const child = HostAdapter.create(childR);

    HostAdapter.insert(parent, 'Main', child);
    const inst = HostAdapter.finalize(parent);
    const { element } = asReactInstance(inst);

    const slotEl = (element as any).props.Main;
    expect(React.isValidElement(slotEl)).to.eql(true);
    const ChildComp = (childR.module as t.ReactModule).default;
    expect(slotEl.type).to.equal(ChildComp);
    expect(slotEl.props.c).to.equal(42);
  });

  it('insert: multiple children (array) preserves order', () => {
    const parentR: t.ResolvedPlanNode<F> = {
      component: 'A:view',
      module: mod('A:view'),
    };
    const c1: t.ResolvedPlanNode<F> = {
      component: 'B:view',
      module: mod('B:view'),
      props: { i: 1 },
    };
    const c2: t.ResolvedPlanNode<F> = {
      component: 'C:view',
      module: mod('C:view'),
      props: { i: 2 },
    };

    const parent = HostAdapter.create(parentR);
    const n1 = HostAdapter.create(c1);
    const n2 = HostAdapter.create(c2);

    HostAdapter.insert(parent, 'List', [n1, n2]);

    const inst = HostAdapter.finalize(parent);
    const { element } = asReactInstance(inst);

    const list = (element as any).props.List;
    expect(Array.isArray(list)).to.eql(true);
    expect(list).to.have.length(2);

    const C1 = (c1.module as t.ReactModule).default;
    const C2 = (c2.module as t.ReactModule).default;

    expect(list[0].type).to.equal(C1);
    expect(list[0].props.i).to.equal(1);
    expect(list[1].type).to.equal(C2);
    expect(list[1].props.i).to.equal(2);
  });

  it('deep nesting: arrays under slots become arrays of React elements', () => {
    // A → List: [ B, C(Main: B) ]
    const A: t.ResolvedPlanNode<F> = { component: 'A:view', module: mod('A:view') };
    const B: t.ResolvedPlanNode<F> = {
      component: 'B:view',
      module: mod('B:view'),
      props: { b: true },
    };
    const C: t.ResolvedPlanNode<F> = { component: 'C:view', module: mod('C:view') };

    const a = HostAdapter.create(A);
    const b = HostAdapter.create(B);
    const c = HostAdapter.create(C);

    // Nest B into C under Main
    HostAdapter.insert(c, 'Main', b);
    // Put [B, C] under A.List
    HostAdapter.insert(a, 'List', [b, c]);

    const inst = HostAdapter.finalize(a);
    const { element } = asReactInstance(inst);

    const list = (element as any).props.List as Array<React.ReactElement<any>>;

    expect(list).to.have.length(2);

    const BComp = (B.module as t.ReactModule).default;
    const CComp = (C.module as t.ReactModule).default;

    // list[0] is B
    expect(list[0].type).to.equal(BComp);
    expect((list[0].props as any).b).to.equal(true);

    // list[1] is C with a nested Main prop that is a React element (B)
    expect(list[1].type).to.equal(CComp);
    const mainEl = (list[1].props as any).Main as React.ReactElement<any>;
    expect(React.isValidElement(mainEl)).to.eql(true);
    expect(mainEl.type).to.equal(BComp);
  });

  it('update/remove are no-ops (do not throw)', () => {
    const r: t.ResolvedPlanNode<F> = { component: 'A:view', module: mod('A:view') };
    const node = HostAdapter.create(r);

    expect(() => HostAdapter.update?.(node, { next: true })).to.not.throw();
    expect(() => HostAdapter.remove(node)).to.not.throw();
  });
});

/**
 * Helpers:
 */

/**
 * Local helper: make a ReactModule whose default component is named for easy assertions.
 */
function mod(name: string): t.ReactModule {
  const C: React.FC<any> = (props) => React.createElement('div', { 'data-c': name, ...props });
  (C as any).displayName = name;
  return { default: C };
}
