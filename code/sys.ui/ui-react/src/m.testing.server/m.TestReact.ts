import type { t } from './common.ts';
import { render } from './u.render.tsx';
import { renderHook, act } from './u.renderHook.ts';

/**
 * Renders an element into the service-side test DOM.
 */
export const TestReact: t.TestReactServerLib = {
  render,
  renderHook,
  act,
};
