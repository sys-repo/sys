/**
 * @module
 */
import { type t, AppContent, Color } from './common.ts';
import { createSignals } from './m.Signals.ts';

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
  theme(state: t.AppSignals) {
    const p = state.props;
    const content = p?.content.value;
    const value = content?.theme ?? p?.theme.value ?? 'Dark';
    const name = typeof value === 'function' ? value(state) : value;
    return Color.theme(name);
  },
} as const;
