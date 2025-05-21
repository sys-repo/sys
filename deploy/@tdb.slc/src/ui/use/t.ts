import type { t } from './common.ts';
export type * from './use.MiniApp.t.ts';

/**
 * Hook: Keyboard controller.
 */
export type UseKeyboardFactory = (state?: t.AppSignals) => void;
