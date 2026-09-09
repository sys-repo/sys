import { type t, VideoSignals } from './common.ts';

export const create: t.VideoDecksLib['create'] = (opts = {}) => {
  const { cornerRadius = 4 } = opts;
  const createVideo = () => VideoSignals.create({ cornerRadius, showControls: false, muted: true });
  return {
    A: createVideo(),
    B: createVideo(),
  };
};
