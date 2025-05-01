import { type t, VIDEO } from './common.ts';
import { Dir, image, v } from './u.tsx';

const Impact = VIDEO.Model.Impact;
const dir = Dir.programme.dir('model.impact');

export const impact: t.VideoMediaContent = {
  id: 'model.impact',
  title: 'Impact Model',
  video: v(Impact.Entry.src),
  panel: 'impact',
  timestamps: {
    '00:00:00.000': { main: () => image(dir.path('impact-model.png')) },
    '00:00:05.000': { main: () => image(dir.path('impact-model-diagram.png')) },
  },
  children: [
    {
      id: 'context',
      title: `Context`,
      video: v(Impact.Context.src),
      timestamps: {
        '00:00:00.000': { main: () => image(dir.path('impact-model-diagram.png')) },
      },
    },
    {
      id: 'disclaimer',
      title: `Disclaimer`,
      video: v(Impact.Disclaimer.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('impact-model-diagram.png')) } },
    },
    {
      id: 'issue',
      title: `Issue`,
      video: v(Impact.Issue.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('impact-model-issue.png')) } },
    },
    {
      id: 'participants',
      title: `Participants`,
      video: v(Impact.Participants.src),
      timestamps: {
        '00:00:00.000': { main: () => image(dir.path('impact-model-participants.png')) },
      },
    },
    {
      id: 'activities',
      title: `Activities`,
      video: v(Impact.Activities.src),
      timestamps: {
        '00:00:00.000': { main: () => image(dir.path('impact-model-activities.png')) },
      },
    },
    {
      id: 'outcome.short',
      title: `Short Term Outcomes`,
      video: v(Impact.Outcome.Short.src),
      timestamps: {
        '00:00:00.000': { main: () => image(dir.path('impact-model-st-outcomes.png')) },
      },
    },
    {
      id: 'outcome.medium',
      title: `Medium Term Outcomes`,
      video: v(Impact.Outcome.Medium.src),
      timestamps: {
        '00:00:00.000': { main: () => image(dir.path('impact-model-mt-outcomes.png')) },
      },
    },
    {
      id: 'outcome.long',
      title: `Long Term Outcomes`,
      video: v(Impact.Outcome.Long.src),
      timestamps: {
        '00:00:00.000': { main: () => image(dir.path('impact-model-lt-outcomes.png')) },
      },
    },
    {
      id: 'imact',
      title: `Impact`,
      video: v(Impact.Impact.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('impact-model-impact.png')) } },
    },
    // { id: 'example', title: `Example`, video: v(Impact.e), timestamps: {} },
  ],
};
