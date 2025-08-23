import ReactDOMServer from 'react-dom/server';
import { describe, expect, it } from '../../-test.ts';

import { Factory } from '@sys/ui-factory/core';
import { useFactory } from '@sys/ui-factory/react';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

/**
 * Minimal Hello component and registration.
 */
const regs = [
  {
    spec: { id: 'Hello:view', slots: [] },
    load: async () => ({
      default: ({ name }: { name: string }) => <h1>Hello, {name}!</h1>,
    }),
  },
] satisfies readonly ReactRegistration<'Hello:view'>[];

const factory = Factory.make(regs);
type F = typeof factory;

const plan: Plan<F> = {
  root: { component: 'Hello:view', props: { name: 'World' } },
};

/**
 * Harness components that call the hook and render simple markers
 * we can assert on using plain SSR string output.
 */
function EagerHarness(props: { factory?: F; plan?: Plan<F> }) {
  const { element, loading, error } = useFactory(props.factory, props.plan, { strategy: 'eager' });
  return (
    <div data-kind="eager">
      <div data-loading={String(loading)} />
      <div data-error={String(Boolean(error))} />
      <div data-has-el={String(Boolean(element))} />
      {/* On SSR, effects don't run, so `element` will be null here */}
      {element}
    </div>
  );
}

function SuspenseHarness(props: { factory?: F; plan?: Plan<F> }) {
  const { element } = useFactory(props.factory, props.plan, { strategy: 'suspense' });
  return <div data-kind="suspense">{element}</div>;
}

describe('hook: useFactory', () => {
  it('eager: SSR produces wrapper without resolved content (effects run on client)', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <EagerHarness factory={factory} plan={plan} />,
    );

    expect(html).to.include('data-kind="eager"');

    // Initial eager state on the server: not loading, no error, no element yet.
    expect(html).to.include('data-loading="false"');
    expect(html).to.include('data-error="false"');
    expect(html).to.include('data-has-el="false"');

    // The resolved content appears only after effects on the client.
    expect(html).to.not.include('Hello, World!');
  });

  it('suspense: SSR does not show fallback unless a child truly suspends', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <SuspenseHarness factory={factory} plan={plan} />,
    );

    // Suspense container is rendered…
    expect(html).to.include('data-kind="suspense"');

    // …but since nothing suspends during SSR here, no fallback appears.
    expect(html).to.not.include('data-fallback');

    // Same as eager: effects don’t run on the server, so no resolved content yet.
    expect(html).to.not.include('Hello, World!');
  });
});
