/**
 * @module
 */
import { type t, Color } from './common.ts';
import { AppContent } from './m.Content.ts';
import { createSignals } from './m.Signals.ts';
export { VIDEO } from './VIDEO.index.ts';

/**
 * The root level Application (State Model).
 */
export const App = {
  Content: AppContent,

  /**
   * Create a new instance of the application-state signals API.
   */
  signals: createSignals,

  /**
   * Derive the theme from the given app/signals instance.
   */
  theme(instance?: t.AppSignals) {
    const p = instance?.props;
    const content = p?.content.value;
    const name = content?.theme ?? p?.theme.value ?? 'Dark';
    return Color.theme(name);
  },
} as const;
