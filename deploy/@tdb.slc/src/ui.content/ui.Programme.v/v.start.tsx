import { type t, Dir, LogoWordmark, v, VIDEO } from './common.ts';
import { center, image } from './u.tsx';

const Intro = VIDEO.Intro;
const url = Dir.programme.dir('start');

export const start: t.VideoMediaContent = {
  id: 'start',
  title: 'Getting Started',
  video: v(Intro.About.src),
  timestamps: {
    '00:00:00.000': { main: () => center(<LogoWordmark style={{ width: 200 }} />) },
    '00:00:03.000': { main: () => image(url.path('slc-image.png')) },
    '00:00:12.650': { main: () => image(url.path('models.png')) },
    '00:00:32.290': { main: () => center(<LogoWordmark logo={'CC'} style={{ width: 400 }} />) },
  },
  children: [
    {
      id: 'how',
      title: `How to use the Canvas`,
      video: v(Intro.HowToUse.src),
      timestamps: {
        '00:00:00.000': { main: () => image(url.path('slc-image.png')) },
        '00:00:04.000': { main: () => image(url.path('models.png')) },
        '00:00:21.000': { main: () => image(url.path('models-impact.png')) },
      },
    },
    {
      id: 'purpose',
      title: `Purpose`,
      video: v(Intro.Purpose.src),
      panel: 'purpose',
      timestamps: { '00:00:00.000': { main: () => image(url.path('purpose.png')) } },
    },
  ],
};
