import type { t } from './common.ts';

/**
 * Signal controllers for the application state.
 */
export type AppControllersLib = {
  /** Hooks up all baseline controllers */
  listen(state: t.AppSignals, until$?: t.UntilObservable): AppController;

  /**
   * Hook into the given state and apply controller logic
   * based on live changes to the application.
   */
  background(state: t.AppSignals, until$?: t.UntilInput): AppController;
};

/**
 * Common interface for application controllers.
 */
export type AppController = t.Lifecycle & {
  readonly id: t.StringId;
  readonly children: AppController[];
};
