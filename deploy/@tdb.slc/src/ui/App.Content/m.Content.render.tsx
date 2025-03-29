import React from 'react';
import { type t, Timestamp, css } from './common.ts';

/**
 * Renders the body of the matching timestamp.
 */
export function render(state?: t.AppSignals): t.ReactNode {
  if (!state) return [];
  const stack = state.stack.items;
  const levels = stack.map((content, i) => renderLevel(state, content, i));
  return levels;
}

/**
 * Render a single level in the stack.
 */
function renderLevel(state: t.AppSignals, content: t.Content, index: number) {
  const theme = wrangle.theme(content, state);
  const children = renderTimestamp(index, state, content, theme);

  let elBase: t.ReactNode | undefined;
  if (typeof content.render === 'function') {
    elBase = content.render({ index, children, content, state, theme });
  }

  const base = css({ Absolute: 0, display: 'grid' });
  return (
    <div key={`${content.id}.${index}`} className={base.class}>
      {elBase ?? children}
    </div>
  );
}

/**
 * Render the current timestamp content.
 */
function renderTimestamp(
  index: number,
  state: t.AppSignals,
  content: t.Content,
  theme: t.CommonTheme,
) {
  const secs = state?.video.props.currentTime.value ?? -1;
  const timestamps = content?.timestamps ?? {};
  const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
  if (!match?.data) return null;
  if (typeof match.data.render !== 'function') return null;

  const timestamp = match.timestamp;
  return match.data.render({ index, state, content, timestamp, theme });
}

/**
 * Helpers
 */
const wrangle = {
  theme(content: t.Content, state: t.AppSignals): t.CommonTheme {
    return 'Dark'; // TEMP 🐷
    // const theme = typeof content.theme === 'function' ? content.theme(state) : content?.theme;
    // return theme ?? App.theme(state).name;
  },
} as const;
