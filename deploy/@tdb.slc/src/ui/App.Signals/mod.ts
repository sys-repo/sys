/**
 * @module
 */
import { createSignals } from './m.Signals.ts';
export { VIDEO } from './VIDEO.index.ts';
import { AppContent } from './m.Content.ts';

/**
 * The root level Application (State Model).
 */
export const App = {
  Content: AppContent,

  /**
   * Create a new instance of the application-state signals API.
   */
  signals: createSignals,
} as const;
