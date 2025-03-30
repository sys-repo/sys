import React from 'react';
import { type t, AnimatePresence, Breakpoint, css, DEFAULTS, Timestamp } from './common.ts';
import { Player } from './m.Content.Player.ts';

/**
 * Renders the body of the matching timestamp.
 */
export function renderStack(state?: t.AppSignals): t.ReactNode {
  if (!state) return [];
  const breakpoint = Breakpoint.from(state.props.screen.breakpoint.value);
  const stack = state.stack.items ?? [];
  const nodes = stack.map((content, index) => renderLevel({ index, state, content, breakpoint }));
  return <AnimatePresence>{nodes}</AnimatePresence>;
}

/**
 * Render a single level in the stack.
 */
function renderLevel(args: {
  index: number;
  state: t.AppSignals;
  content: t.Content;
  breakpoint: t.Breakpoint;
}) {
  const { state, content, index, breakpoint } = args;
  const theme = wrangle.theme(content, state);
  const isTop = wrangle.isTop(state, index);
  const isBottom = index === 0;

  const children = renderTimestamp({ index, state, content, theme, breakpoint });
  const el = content.render?.({
    index,
    children,
    content,
    state,
    theme,
    breakpoint,
    isTop,
    isBottom,
  });

  const style = css({
    Absolute: 0,
    display: 'grid',
    pointerEvents: 'none',
    zIndex: 0, // NB: establish a new stacking context.
  });
  return (
    <div key={`${content.id}.${index}`} className={style.class}>
      {el ?? children}
    </div>
  );
}

/**
 * Render the current timestamp content.
 */
function renderTimestamp(args: {
  index: number;
  state: t.AppSignals;
  content: t.Content;
  theme: t.CommonTheme;
  breakpoint: t.Breakpoint;
}) {
  const { index, state, content, theme, breakpoint } = args;
  const isTop = wrangle.isTop(state, index);
  const isBottom = index === 0;

  const player = Player.find(state, content, index);

  const secs = player?.props.currentTime.value ?? -1;
  const timestamps = content?.timestamps ?? {};
  const match = Timestamp.find(timestamps, secs, { unit: 'secs' });

  if (!match?.data) return null;
  if (typeof match.data.render !== 'function') return null;

  return match.data.render({
    timestamp: match.timestamp,
    index,
    state,
    content,
    theme,
    breakpoint,
    isTop,
    isBottom,
  });
}

/**
 * Helpers
 */
const wrangle = {
  theme(content: t.Content, state: t.AppSignals): t.CommonTheme {
    // NB: hard-coded from default.
    //     Possibly expand this later to store theme state on the App signals.
    return DEFAULTS.theme.base;
  },

  isTop(state: t.AppSignals, index: number) {
    return index === state.stack.length - 1;
  },
} as const;
