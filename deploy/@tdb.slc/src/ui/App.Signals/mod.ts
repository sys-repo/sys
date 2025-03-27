/**
 * @module
 */
import { createSignals } from './m.Signals.ts';
export { VIDEO } from './VIDEO.index.ts';

/**
 * The root level Application (State Model).
 */
export const App = {
  /**
   * Create a new instance of the application-state signals API.
   */
  signals: createSignals,
} as const;
