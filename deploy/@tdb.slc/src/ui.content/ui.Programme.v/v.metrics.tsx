import { type t, Dir, v, VIDEO } from './common.ts';
import { image } from './u.tsx';

const url = Dir.programme.dir('metrics');

export const metrics: t.VideoMediaContent = {
  id: 'metrics',
  title: 'Key Metrics',
  panel: 'metrics',
  video: v(VIDEO.KeyMetrics.src),
  timestamps: {
    '00:00:00.000': { main: () => image(url.path('key-metrics.png')) },
  },
};
