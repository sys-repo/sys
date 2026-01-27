import type { t } from './common.ts';

/** Type re-export. */
export type * from './t.hook.ts';
export type * from './t.render.ts';

/**
 * Tools for testing React on the server.
 */
export type TestReactServerLib = {
  readonly render: t.TestReactRender;
  readonly renderHook: t.TestReactRenderHook;
  readonly act: t.TestReactAct;
};
