import type { t } from './common.ts';

/**
 * Root Application (logic) API.
 */
export type AppLib = {
  readonly type: '@tdb.slc:app';

  readonly Signals: t.AppSignalsLib;
  readonly signals: t.AppSignalsLib['create'];

  readonly Layout: t.AppLayoutLib;
  readonly Render: t.AppRenderLib;
};
