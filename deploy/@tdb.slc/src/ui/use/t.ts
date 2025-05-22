import type { t } from './common.ts';

/**
 * Hook: Keyboard controller.
 */
export type UseKeyboardFactory = (state?: t.AppSignals) => void;
