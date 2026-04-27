import React from 'react';
import { describe, expect, it, type t } from '../../-test.ts';
import { HostAdapter } from '../mod.ts';

type Id = 'A:view' | 'B:view';
type Slot = 'Main';
type F = t.ReactFactory<Id, Slot>;

const A: t.ResolvedPlanNode<F> = {
  component: 'A:view',
  module: {
    default: ({ Main }: { Main?: React.ReactNode }) => <section data-a>{Main}</section>,
  } satisfies t.ReactModule,
};

const B: t.ResolvedPlanNode<F> = {
  component: 'B:view',
  module: {
    default: ({ label }: { label?: string }) => <button data-b>{label}</button>,
  } satisfies t.ReactModule,
  props: { label: 'Click' },
};

describe('React TSX smoke', () => {
  it('renders slots as JSX props/children', () => {
    const a = HostAdapter.create(A);
    const b = HostAdapter.create(B);

    HostAdapter.insert(a, 'Main', b);
    const inst = HostAdapter.finalize(a);
    const el = (inst as { element: React.ReactElement }).element;

    const AComp = (A.module as t.ReactModule).default;
    const BComp = (B.module as t.ReactModule).default;

    // Root element is <A>
    expect(el.type).to.equal(AComp);

    // Slot "Main" rendered as a React element <B>
    const Main = (el.props as any).Main as React.ReactElement<any>;
    expect(Main.type).to.equal(BComp);
    expect(Main.props.label).to.equal('Click');
  });
});
