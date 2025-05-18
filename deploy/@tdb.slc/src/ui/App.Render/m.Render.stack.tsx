import React from 'react';
import { type t, AnimatePresence, css, DEFAULTS } from './common.ts';

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
export function render(args: { index: number; state: t.AppSignals; content: t.Content }) {
  const { state, content, index } = args;
  const theme = wrangle.theme(content, state);
  const el = content.render?.({ index, content, state, theme });

  const style = css({
    Absolute: 0,
    pointerEvents: 'none',
    zIndex: 0, // NB: establish a new stacking context (prevents content jumping above higher stack levels).
    display: 'grid',
  });

  return (
    <div key={`${content.id}.${index}`} className={style.class}>
      {el}
    </div>
  );
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
} as const;
