import type { t } from './common.ts';

/**
 * Root Application (logic) API.
 */
export type AppLib = {
  readonly Signals: t.AppSignalsLib;
  readonly signals: t.AppSignalsLib['create'];
};
