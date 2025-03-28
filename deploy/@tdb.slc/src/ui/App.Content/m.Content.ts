import { type t } from './common.ts';
import { VIDEO } from './VIDEO.index.ts';

type T = t.AppContent;

export const AppContent = {
  async find(id: t.Stage): Promise<T | undefined> {
    if (id === 'Entry') {
      return { id };
    }

    if (id === 'Trailer') {
      const content: T = { id, video: { src: VIDEO.Trailer.src } };
      return withThemeMethods(content);
    }

    if (id === 'Overview') {
      const content: T = { id, video: { src: VIDEO.Overview.src } };
      return withThemeMethods(content);
    }

    if (id === 'Programme') {
      return { id };
    }
  },
} as const;

/**
 * Helpers
 */
function withThemeMethods(input: T): T {
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
