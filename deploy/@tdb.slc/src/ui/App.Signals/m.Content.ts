import { type t } from './common.ts';
import { VIDEO } from './VIDEO.index.ts';

export const AppContent = {
  async find(id: t.Stage): Promise<t.AppContent | undefined> {
    if (id === 'Entry') {
      return { id };
    }

    if (id === 'Trailer') {
      return { id, video: { src: VIDEO.Trailer.src } };
    }

    if (id === 'Overview') {
      return { id, video: { src: VIDEO.Overview.src } };
    }

    if (id === 'Programme') {
      return { id };
    }
  },
} as const;
