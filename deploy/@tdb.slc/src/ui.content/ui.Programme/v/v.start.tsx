import { type t, VIDEO } from './common.ts';
import { v } from './u.ts';

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
        '00:00:00.000': {
          main: () => <div style={{ fontSize: 64 }}>🌳</div>,
        },
        '00:00:02.000': {
          main: () => <div style={{ fontSize: 64 }}>🐷</div>,
        },
      },
    },
    { id: 'how', title: `How to use the Canvas`, video: v(Intro.HowToUse.src), timestamps: {} },
    { id: 'purpose', title: `Purpose`, video: v(Intro.Purpose.src), timestamps: {} },
  ],
};
