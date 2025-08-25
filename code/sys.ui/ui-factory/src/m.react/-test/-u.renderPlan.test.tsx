import React from 'react';
import { describe, it, expect, type t } from '../../-test.ts';
import { Factory, Plan } from '@sys/ui-factory/core';
import { renderPlan } from '../mod.ts';

/**
 * Domain unions:
 */
type Id = 'Layout:root' | 'Button:view';
type Slot = 'Main';

/**
 * Local components for testing.
 */
const Layout: t.ReactModule = {
  default: ({ Main }: { Main?: React.ReactNode }) => <section data-id="layout">{Main}</section>,
};

const Button: t.ReactModule = {
  default: ({ label }: { label: string }) => <button data-id="button">{label}</button>,
};

describe('React: renderPlan (integration)', () => {
  it('renders a canonical plan into a React element tree', async () => {
    // Factory with two views:
    const f = Factory.make<Id, t.ReactRegistration<Id, Slot>>([
      {
        spec: { id: 'Layout:root', slots: ['Main'] },
        load: async () => Layout,
      },
      {
        spec: { id: 'Button:view', slots: [] },
        load: async () => Button,
      },
    ]) satisfies t.ReactFactory<Id, Slot>;

    // Author a plan: Layout → Button(Main)
    const plan: t.Plan<typeof f> = {
      root: {
        component: 'Layout:root',
        slots: {
          Main: {
            component: 'Button:view',
            props: { label: 'Click me' },
          },
        },
      },
    };

    // One-liner:
    const el = await renderPlan(plan, f);

    // Assertions:
    expect(React.isValidElement(el)).to.eql(true);
    expect(el.type).to.equal(Layout.default);

    const main = (el.props as any).Main as React.ReactElement<{ label: string }>;
    expect(main.type).to.equal(Button.default);
    expect(main.props.label).to.equal('Click me');
  });
});
