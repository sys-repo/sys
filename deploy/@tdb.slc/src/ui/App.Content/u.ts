import { type t } from './common.ts';

export function withThemeMethods(input: t.AppContent): t.AppContent {
  return {
    ...input,
    theme(state) {
      const breakpoint = wrangle.breakpoint(state);
      if (breakpoint === 'Mobile') return 'Light';
      return 'Dark';
    },
    solidBackground(state) {
      const breakpoint = wrangle.breakpoint(state);
      return breakpoint === 'Mobile';
    },
  };
}

/**
 * Helpers
 */
const wrangle = {
  breakpoint(state: t.AppSignals) {
    return state.props.breakpoint.value;
  },
} as const;
