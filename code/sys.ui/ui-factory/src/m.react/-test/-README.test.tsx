import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { Factory } from '@sys/ui-factory/core';
import { renderPlan } from '@sys/ui-factory/react';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

import { describe, expect, it } from '../../-test.ts';

describe('README: React Sample', () => {
  it('renders HelloWorld plan into a React tree', async () => {
    // 1. Define registrations (components).
    const regs = [
      {
        spec: { id: 'Hello:view', slots: [] },
        load: async () => ({
          default: ({ name }: { name: string }) => <h1>Hello, {name}!</h1>,
        }),
      },
    ] satisfies readonly ReactRegistration<'Hello:view'>[];

    // 2. Build a factory.
    const factory = Factory.make(regs);

    // 3. Author a simple plan.
    const plan: Plan<typeof factory> = {
      root: { component: 'Hello:view', props: { name: 'World' } },
    };

    // 4. Render to a React element.
    const element = await renderPlan(plan, factory);

    // Assert: it is a valid React element.
    expect(React.isValidElement(element)).to.eql(true);

    // Render to string for sanity check.
    const html = ReactDOMServer.renderToStaticMarkup(element);
    expect(html).to.include('<h1');
    expect(html).to.include('Hello, World');
  });
});
