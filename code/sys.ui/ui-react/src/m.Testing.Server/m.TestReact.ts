import type { TestReactServerLib } from './t.ts';
import { render } from './u.render.tsx';

/**
 * Renders an element into the service-side test DOM.
 */
export const TestReact: TestReactServerLib = {
  render,
};
