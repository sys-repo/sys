import { type t, App, Timestamp } from './common.ts';

/**
 * Renders the body of the matching timestamp.
 */
export function render(state?: t.AppSignals): t.ReactNode | null {
  if (!state) return null;
  const content = state.props.content.value;
  if (!content) return null;

  /**
   * Find timestamp:
   */
  const secs = state?.video.props.currentTime.value ?? -1;
  const timestamps = content?.timestamps ?? {};
  const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
  if (!match) return null;
  if (typeof match.render !== 'function') return null;

  /**
   * Render:
   */
  const theme = wrangle.theme(content, state);
  return match.render({ state, theme });
}

/**
 * Helpers
 */
const wrangle = {
  theme(content: t.AppContent, state: t.AppSignals) {
    const theme = typeof content.theme === 'function' ? content.theme(state) : content?.theme;
    return theme ?? App.theme(state).name;
  },
} as const;
