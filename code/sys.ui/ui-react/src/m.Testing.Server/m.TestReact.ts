import { type t } from './common.ts';
import { render } from './u.render.tsx';

/**
 * Renders an element into the service-side test DOM.
 */
export const TestReact: t.TestReactServerLib = {
  render,
};
