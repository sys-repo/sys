import type { t } from './common.ts';

export const serve: t.DenoEntry.Serve = async (_options) => {
  return {
    fetch() {
      return new Response('Not implemented', { status: 501 });
    },
  };
};
