import { type t } from './common.ts';
import { DUMMY, v } from './u.ts';

export const econ: t.VideoMediaContent = {
  id: 'model.econ',
  title: 'Economic Model',
  video: v(DUMMY),
  timestamps: {},
  children: [
    { id: 'channels', title: `Channels`, video: v(DUMMY), timestamps: {} },
    { id: 'financial', title: `Financial Model`, video: v(DUMMY), timestamps: {} },
    { id: 'revenue', title: `Revenue`, video: v(DUMMY), timestamps: {} },
    { id: 'costs', title: `Costs`, video: v(DUMMY), timestamps: {} },
    { id: 'advantage.leverage', title: `Advantage: Leverage`, video: v(DUMMY), timestamps: {} },
    { id: 'advantage.innovate', title: `Advantage: Innovate`, video: v(DUMMY), timestamps: {} },
    { id: 'example', title: `Example`, video: v(DUMMY), timestamps: {} },
  ],
};
