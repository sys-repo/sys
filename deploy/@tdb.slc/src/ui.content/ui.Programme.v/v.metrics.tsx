import { type t, Dir, VIDEO } from './common.ts';
import { image, v } from './u.tsx';

export const metrics = (): t.VideoMediaContent => {
  const dir = Dir.programme.dir('metrics');
  return {
    id: 'metrics',
    title: 'Key Metrics',
    panel: 'metrics',
    video: v(VIDEO.KeyMetrics.src),
    timestamps: {
      '00:00:00.000': { main: () => image(dir.path('key-metrics.png')) },
    },
  };
};
