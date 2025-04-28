import { type t, VIDEO } from './common.ts';
import { Dir, image, v } from './u.tsx';

const Economic = VIDEO.Model.Economic;
const dir = Dir.programme.dir('model.econ');

export const econ: t.VideoMediaContent = {
  id: 'model.econ',
  title: 'Economic Model',
  video: v(Economic.Entry.src),
  timestamps: {
    '00:00:00.000': { main: () => image(dir.path('economic-model-1.png')) },
    '00:00:18.000': { main: () => image(dir.path('economic-model-2.png')) },
  },

  children: [
    {
      id: 'channels',
      title: `Channels`,
      video: v(Economic.Channels.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('channels.png')) } },
    },
    {
      id: 'financial',
      title: `Financial Model`,
      video: v(Economic.Financial.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('financial-model.png')) } },
    },
    {
      id: 'revenue',
      title: `Revenue`,
      video: v(Economic.Revenue.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('revenue.png')) } },
    },
    {
      id: 'costs',
      title: `Costs`,
      video: v(Economic.Costs.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('costs.png')) } },
    },
    {
      id: 'advantage.leverage',
      title: `Advantage: Leverage`,
      video: v(Economic.Advantage.Leverage.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('advantage.png')) } },
    },
    {
      id: 'advantage.innovate',
      title: `Advantage: Innovate`,
      video: v(Economic.Advantage.Innovate.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('advantage.png')) } },
    },
    // { id: 'example', title: `Example`, video: v(Economic.Example.src), timestamps: {} },
  ],
};
