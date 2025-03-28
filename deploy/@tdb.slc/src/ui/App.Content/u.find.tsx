import { type t } from './common.ts';
import { VIDEO } from './VIDEO.index.ts';

type T = t.AppContent;

/**
 * Looks up the content for the given ID.
 */
export async function find(id: t.Stage): Promise<T | undefined> {
  if (id === 'Entry') {
    return { id };
  }

  if (id === 'Trailer') {
    const content: T = {
      id,
      video: { src: VIDEO.Trailer.src },
      timestamps: {
        '00:00:00.000': {
          tmp: '1',
          render(props) {
            return <div>👋 Hello Trailer</div>;
          },
        },
        '00:00:02.000': {
          tmp: '2',
          render(props) {
            return <div>👋 Hello Second</div>;
          },
        },
      },
    };
    return withThemeMethods(content);
  }

  if (id === 'Overview') {
    const content: T = { id, video: { src: VIDEO.Overview.src } };
    return withThemeMethods(content);
  }

  if (id === 'Programme') {
    return { id };
  }
}

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

const wrangle = {
  breakpoint(state: t.AppSignals) {
    return state.props.breakpoint.value;
  },
} as const;
