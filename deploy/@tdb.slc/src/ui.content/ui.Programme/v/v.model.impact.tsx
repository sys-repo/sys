import { type t, VIDEO } from './common.ts';
import { v } from './u.ts';

const Impact = VIDEO.Model.Impact;

export const impact: t.VideoMediaContent = {
  id: 'model.impact',
  title: 'Impact Model',
  video: v(Impact.Entry.src),
  timestamps: {},
  children: [
    { id: 'context', title: `Context`, video: v(Impact.Context.src), timestamps: {} },
    { id: 'disclaimer', title: `Disclaimer`, video: v(Impact.Disclaimer.src), timestamps: {} },
    { id: 'issue', title: `Issue`, video: v(Impact.Issue.src), timestamps: {} },
    {
      id: 'participants',
      title: `Participants`,
      video: v(Impact.Participants.src),
      timestamps: {},
    },
    { id: 'activities', title: `Activities`, video: v(Impact.Activities.src), timestamps: {} },
    {
      id: 'outcome.short',
      title: `Short Term Outcomes`,
      video: v(Impact.Outcome.Short.src),
      timestamps: {},
    },
    {
      id: 'outcome.medium',
      title: `Medium Term Outcomes`,
      video: v(Impact.Outcome.Medium.src),
      timestamps: {},
    },
    {
      id: 'outcome.long',
      title: `Long Term Outcomes`,
      video: v(Impact.Outcome.Long.src),
      timestamps: {},
    },
    { id: 'imact', title: `Impact`, video: v(Impact.Impact.src), timestamps: {} },
    // { id: 'example', title: `Example`, video: v(Impact.e), timestamps: {} },
  ],
};
