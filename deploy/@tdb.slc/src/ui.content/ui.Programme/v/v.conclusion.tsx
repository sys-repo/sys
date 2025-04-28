import { type t, VIDEO } from './common.ts';
import { Dir, image, v } from './u.tsx';

const dir = Dir.programme.dir('conclusion');

export const conculsion: t.VideoMediaContent = {
  id: 'conculsion',
  title: 'Conclusion',
  video: v(VIDEO.Conclusion.src),
  timestamps: {
    '00:00:00.000': { main: () => image(dir.path('conclusion.png')) },
  },
};
