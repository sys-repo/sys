import { type t, VIDEO } from './common.ts';
import { v } from './u.ts';

const Intro = VIDEO.Intro;

export const start: t.VideoMediaContent = {
  id: 'start',
  title: 'Getting Started',
  video: v(Intro.Entry.src),
  timestamps: {},
  children: [
    { id: 'about', title: `About this Programme`, video: v(Intro.About.src), timestamps: {} },
    { id: 'how', title: `How to use the Canvas`, video: v(Intro.HowToUse.src), timestamps: {} },
    {
      id: 'finished',
      title: `When You're Finished`,
      video: v(Intro.WhenFinished.src),
      timestamps: {},
    },
    { id: 'purpose', title: `Purpose`, video: v(Intro.Purpose.src), timestamps: {} },
  ],
};
