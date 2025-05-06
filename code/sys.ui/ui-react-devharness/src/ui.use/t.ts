import type { t } from './common.ts';

/**
 * Hook: DevHarness Keyboard controller.
 */
export type UseDevKeyboard = (options?: UseDevKeyboardOptions) => void;

/** Options passed to the dev keyboard hook. */
export type UseDevKeyboardOptions = {
  clearConsole?: boolean;
  cancelSave?: boolean;
  cancelPrint?: boolean;
  dispose$?: t.UntilInput;
};
