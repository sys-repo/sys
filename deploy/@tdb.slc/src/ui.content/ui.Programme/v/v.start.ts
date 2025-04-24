import { type t } from './common.ts';
import { DUMMY, v } from './u.ts';

export const start: t.VideoMediaContent = {
  id: 'start',
  title: 'Getting Started',
  video: v(DUMMY),
  timestamps: {},
  children: [
    { id: 'about', title: `About this Programme`, video: v(DUMMY), timestamps: {} },
    { id: 'how', title: `How to use the Canvas`, video: v(DUMMY), timestamps: {} },
    { id: 'finished', title: `When You're Finished`, video: v(DUMMY), timestamps: {} },
    { id: 'purpose', title: `Purpose`, video: v(DUMMY), timestamps: {} },
  ],
};
