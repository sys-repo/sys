import { type t, Timestamp } from './common.ts';

/**
 * Renders the body of the matching timestamp.
 */
export function render(state?: t.AppSignals): t.ReactNode | null {
  if (!state) return null;

  const content = state.props.content.value;
  const currentSec = state?.video.props.currentTime.value ?? -1;
  const timestamps = content?.timestamps ?? {};
  const match = Timestamp.find(timestamps, currentSec, { unit: 'secs' });
  if (!match) return null;
  return typeof match.render === 'function' ? match.render({ state }) : null;
}
