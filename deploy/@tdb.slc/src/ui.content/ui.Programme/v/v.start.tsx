import { Center, LogoWordmark, type t, VIDEO } from './common.ts';
import { image, v, center } from './u.tsx';

const Intro = VIDEO.Intro;

export const start: t.VideoMediaContent = {
  id: 'start',
  title: 'Getting Started',
  video: v(Intro.About.src),
  timestamps: {},
  children: [
    {
      id: 'about',
      title: `About this Programme`,
      video: v(Intro.About.src),
      timestamps: {
        '00:00:00.000': { main: () => center(<LogoWordmark style={{ width: 200 }} />) },
        '00:00:06.100': { main: () => image('/images/ui.Programme/start/slc-image.png') },
        '00:00:10.000': { main: () => image('/images/ui.Programme/start/models.png') },
        '00:00:32.290': {
          main: () => (
            <Center>
              <LogoWordmark logo={'CC'} style={{ width: 400 }} />
            </Center>
          ),
        },
      },
    },
    { id: 'how', title: `How to use the Canvas`, video: v(Intro.HowToUse.src), timestamps: {} },
    { id: 'purpose', title: `Purpose`, video: v(Intro.Purpose.src), timestamps: {} },
  ],
};
