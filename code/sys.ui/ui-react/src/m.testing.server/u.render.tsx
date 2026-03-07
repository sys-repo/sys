import React, { StrictMode } from 'react';
import { type t, DomMock, Rx } from './common.ts';

export const render: t.TestReactServerLib['render'] = async (el, options = {}) => {
  const { strict = true } = options;

  DomMock.polyfill();
  const { createRoot } = await import('react-dom/client');

  const life = Rx.lifecycle();

  // Construct the server-side DOM:
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  if (strict) el = <StrictMode>{el}</StrictMode>;

  await React.act(async () => {
    root.render(el);
    await Promise.resolve(); // allow microtasks scheduled by effects to flush
  });

  life.dispose$.subscribe(() => {
    void React.act(async () => {
      root.unmount();
      await Promise.resolve(); // allow scheduler/microtasks to drain
      container.remove(); // remove from document to avoid stale queries/leaks
    });
  });

  return Rx.toLifecycle<t.TestReactRendered>(life, { container });
};
