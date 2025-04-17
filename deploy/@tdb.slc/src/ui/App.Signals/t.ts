import type { t } from './common.ts';

export type * from './t.Content.ts';
export type * from './t.Controllers.ts';
export type * from './t.Signals.ts';

/**
 * Library for working with the [AppSignals] model.
 */
export type AppSignalsLib = {
  readonly Controllers: t.AppControllersLib;
  readonly controller: t.AppControllersLib['main'];

  /** Create a new instance of the application-state signals API. */
  create(dispose$?: t.UntilObservable): t.AppSignals;
};
