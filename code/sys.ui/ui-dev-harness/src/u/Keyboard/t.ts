import type { t } from '../common.ts';

export type DevKeyboardLib = {
  /**
   * Common keyboard controller actions for the DevHarness environment.
   */
  listen(options?: t.DevKeyboardOptions): t.KeyboardEventsUntil;
};

/** Options passed to the dev keyboard listen method. */
export type DevKeyboardOptions = {
  clearConsole?: boolean;
  cancelSave?: boolean;
  cancelPrint?: boolean;
  newTab?: boolean;
  copyAddress?: boolean;
  doubleEscapeDelay?: t.Msecs;
  onDoubleEscape?: () => void;
  dispose$?: t.UntilObservable;
};
