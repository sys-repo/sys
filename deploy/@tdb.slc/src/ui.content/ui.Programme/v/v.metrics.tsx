import { type t, VIDEO } from './common.ts';
import { v } from './u.tsx';

export const metrics: t.VideoMediaContent = {
  id: 'metrics',
  title: 'Key Metrics',
  video: v(VIDEO.KeyMetrics.src),
  timestamps: {},
};
