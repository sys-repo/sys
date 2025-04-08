import type { t } from './common.ts';
export type * from './t.Content.ts';

/**
 * Root Application (logic) API.
 */
export type AppLib = {
  readonly Signals: t.AppSignalsLib;
  readonly signals: t.AppSignalsLib['create'];

  readonly Layout: t.AppLayoutLib;
  readonly Render: t.AppRenderLib;
};
