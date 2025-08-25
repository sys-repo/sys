import React from 'react';
import ReactDOMServer from 'react-dom/server';

import type { Infer, Plan, ReactRegistration } from '@sys/ui-factory/t';
import { describe, expect, expectTypeOf, it } from './mod.ts';

describe('README: React Sample', () => {
  describe('### Host Adapter: React', () => {
    /**
     * Render Plan into a React UI/DOM tree via adapter.
     */
    it('### Host Adapter: React', async () => {
      const { Factory } = await import('@sys/ui-factory/core');
      const { renderPlan } = await import('@sys/ui-factory/react');

      // 1. Define registrations (components).
      const regs = [
        {
          spec: { id: 'Hello:view', slots: [] },
          load: async () => ({
            default: (props: { name: string }) => <h1>Hello, {props.name}!</h1>,
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

  describe('## Type Inference', () => {
    it('Consumers derive strong types directly from the schema:', async () => {
      const { HelloSchema } = await import('@sys/ui-factory/sample/catalog');
      type Hello = Infer<typeof HelloSchema>;

      // Strict type equality check:
      const obj = { name: 'foo' };
      expectTypeOf<Hello>(obj).toEqualTypeOf<{ name: string }>();
    });
  });
});
