import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { type t, DomMock, rx, Time } from './common.ts';

/**
 * Renders an element into the service-side test DOM.
 */
export const render: t.TestReactServerLib['render'] = async (el, options = {}) => {
  const { strict = true } = options;
  DomMock.polyfill();

  const life = rx.lifecycle();
  life.dispose$.subscribe(() => root.unmount());

  // Construct the server-side DOM.
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  // Render into DOM.
  if (strict) el = <StrictMode>{el}</StrictMode>;
  root.render(el);
  await Time.wait(0); // NB: ensures the render completes before returning.

  /**
   * API
   */
  const api: t.TestReactRendered = {
    container,

    // Lifecycle.
    dispose: life.dispose,
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  };
  return api;
};
