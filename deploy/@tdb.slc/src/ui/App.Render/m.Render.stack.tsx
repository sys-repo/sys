import React from 'react';
import { type t, AnimatePresence, Breakpoint, css, DEFAULTS } from './common.ts';

/**
 * Renders the body of the matching timestamp.
 */
export function stack(state: t.AppSignals | undefined): t.ReactNode {
  if (!state) return [];
  const stack = state.stack.items ?? [];
  const nodes = stack.map((content, index) => render({ index, state, content }));
  return <AnimatePresence>{nodes}</AnimatePresence>;
}

/**
 * Render a single level in the stack.
 */
function render(args: { index: number; state: t.AppSignals; content: t.Content }) {
  const { state, content, index } = args;
  const breakpoint = Breakpoint.from(state.props.screen.breakpoint.value);
  const theme = wrangle.theme(content, state);
  const is = wrangle.is(state, index);
  const el = content.render?.({ index, content, state, is, theme, breakpoint });

  const style = css({
    Absolute: 0,
    display: 'grid',
    pointerEvents: 'none',
    zIndex: 0, // NB: establish a new stacking context (prevents content jumping above higher stack levels).
  });
  return (
    <div key={`${content.id}.${index}`} className={style.class}>
      {el}
    </div>
  );
}

/**
 * Render the current timestamp content.
 */
// function renderTimestamp(args: {
//   index: number;
//   state: t.AppSignals;
//   content: t.Content;
//   theme: t.CommonTheme;
//   breakpoint: t.Breakpoint;
// }) {
//   const { index, state, content, theme, breakpoint } = args;
//   const is = wrangle.is(state, index);
//
//   const player = AppSignals.Player.find(state, content, index);
//   const secs = player?.props.currentTime.value ?? -1;
//   const timestamps = content?.timestamps ?? {};
//   const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
//
//   if (!match?.data) return null;
//   if (typeof match.data.render !== 'function') return null;
//
//   return match.data.render({
//     timestamp: match.timestamp,
//     index,
//     state,
//     content,
//     theme,
//     breakpoint,
//     is,
//   });
// }

/**
 * Helpers
 */
const wrangle = {
  theme(content: t.Content, state: t.AppSignals): t.CommonTheme {
    // NB: hard-coded from default.
    //     Possibly expand this later to store theme state on the App signals.
    return DEFAULTS.theme.base;
  },

  is(state: t.AppSignals, index: number): t.ContentFlags {
    const top = index === state.stack.length - 1;
    const bottom = index === 0;
    return { top, bottom };
  },
} as const;
