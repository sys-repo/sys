import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { type t, DomMock, Rx } from './common.ts';

export const render: t.TestReactServerLib['render'] = async (el, options = {}) => {
  const { strict = true } = options;
  DomMock.polyfill();

  const life = Rx.lifecycle();
  life.dispose$.subscribe(() => root.unmount());

  // Construct the server-side DOM:
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  if (strict) el = <StrictMode>{el}</StrictMode>;

  /**
   * Ensures that the behavior in tests matches what happens in the browser
   * more closely by executing pending `useEffect`s before returning. This also
   * reduces the amount of re-renders done.
   * @see https://reactjs.org/blog/2019/02/06/react-v16.8.0.html#testing-hooks
   */
  await React.act(async () => {
    root.render(el);
    await Promise.resolve(); // ← microtask delay - simlauted for hooks/effects that also schedule microtasks.
  });

  // API:
  return Rx.toLifecycle<t.TestReactRendered>(life, { container });
};
