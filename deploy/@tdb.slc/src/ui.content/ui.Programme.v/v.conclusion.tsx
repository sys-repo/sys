import { type t, Dir, VIDEO, v } from './common.ts';
import { image } from './u.tsx';

const url = Dir.programme.dir('conclusion');

export const conculsion: t.VideoMediaContent = {
  id: 'conculsion',
  title: 'Conclusion',
  video: v(VIDEO.Conclusion.src),
  timestamps: {
    '00:00:00.000': { main: () => image(url.path('conclusion.png')) },
  },
};
