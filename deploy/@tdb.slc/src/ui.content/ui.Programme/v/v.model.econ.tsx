import { type t, VIDEO } from './common.ts';
import { v } from './u.tsx';

const Economic = VIDEO.Model.Economic;

export const econ: t.VideoMediaContent = {
  id: 'model.econ',
  title: 'Economic Model',
  video: v(Economic.Entry.src),
  timestamps: {},
  children: [
    { id: 'channels', title: `Channels`, video: v(Economic.Channels.src), timestamps: {} },
    {
      id: 'financial',
      title: `Financial Model`,
      video: v(Economic.Financial.src),
      timestamps: {},
    },
    { id: 'revenue', title: `Revenue`, video: v(Economic.Revenue.src), timestamps: {} },
    { id: 'costs', title: `Costs`, video: v(Economic.Costs.src), timestamps: {} },
    {
      id: 'advantage.leverage',
      title: `Advantage: Leverage`,
      video: v(Economic.Advantage.Leverage.src),
      timestamps: {},
    },
    {
      id: 'advantage.innovate',
      title: `Advantage: Innovate`,
      video: v(Economic.Advantage.Innovate.src),
      timestamps: {},
    },
    // { id: 'example', title: `Example`, video: v(Economic.Example.src), timestamps: {} },
  ],
};
