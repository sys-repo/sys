import { type t } from './common.ts';
import { DUMMY, v } from './u.ts';

export const impact: t.VideoMediaContent = {
  id: 'model.impact',
  title: 'Impact Model',
  video: v(DUMMY),
  timestamps: {},
  children: [
    { id: 'context', title: `Context`, video: v(DUMMY), timestamps: {} },
    { id: 'disclaimer', title: `Disclaimer`, video: v(DUMMY), timestamps: {} },
    { id: 'issue', title: `Issue`, video: v(DUMMY), timestamps: {} },
    { id: 'participants', title: `Participants`, video: v(DUMMY), timestamps: {} },
    { id: 'activities', title: `Activities`, video: v(DUMMY), timestamps: {} },
    { id: 'outcome.short', title: `Short Term Outcomes`, video: v(DUMMY), timestamps: {} },
    { id: 'outcome.medium', title: `Medium Term Outcomes`, video: v(DUMMY), timestamps: {} },
    { id: 'outcome.long', title: `Long Term Outcomes`, video: v(DUMMY), timestamps: {} },
    { id: 'imact', title: `Impact`, video: v(DUMMY), timestamps: {} },
    { id: 'example', title: `Example`, video: v(DUMMY), timestamps: {} },
  ],
};
