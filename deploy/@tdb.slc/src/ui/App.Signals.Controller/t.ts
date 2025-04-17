import type { t } from './common.ts';

/**
 * Signal controllers for the application state.
 */
export type AppControllersLib = {
  /** Hooks up all baseline controllers */
  start(state: t.AppSignals, until$?: t.UntilInput): AppController;

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
  readonly kind: AppControllerKind;
  readonly children: AppController[];
};

/** Controller identification codes. */
export type AppControllerKind = 'Controller:App' | 'Controller:App:Background';
