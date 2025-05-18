import { type t, Dir, VIDEO, v } from './common.ts';
import { image } from './u.tsx';

const Economic = VIDEO.Model.Economic;
const url = Dir.programme.dir('model.econ');

export const econ: t.VideoMediaContent = {
  id: 'model.econ',
  title: 'Economic Model',
  video: v(Economic.Entry.src),
  panel: ['revenue', 'costs', 'channels', 'advantage'],
  timestamps: {
    '00:00:00.000': { main: () => image(url.path('economic-model-1.png')) },
    '00:00:18.000': { main: () => image(url.path('economic-model-2.png')) },
  },

  children: [
    {
      id: 'channels',
      title: `Channels`,
      panel: 'channels',
      video: v(Economic.Channels.src),
      timestamps: { '00:00:00.000': { main: () => image(url.path('channels.png')) } },
    },
    {
      id: 'financial',
      title: `Financial Model`,
      panel: ['revenue', 'costs'],
      video: v(Economic.Financial.src),
      timestamps: { '00:00:00.000': { main: () => image(url.path('financial-model.png')) } },
    },
    {
      id: 'revenue',
      title: `Revenue`,
      panel: 'revenue',
      video: v(Economic.Revenue.src),
      timestamps: { '00:00:00.000': { main: () => image(url.path('revenue.png')) } },
    },
    {
      id: 'costs',
      title: `Costs`,
      panel: 'costs',
      video: v(Economic.Costs.src),
      timestamps: { '00:00:00.000': { main: () => image(url.path('costs.png')) } },
    },
    {
      id: 'advantage.leverage',
      title: `Advantage: Leverage`,
      panel: 'advantage',
      video: v(Economic.Advantage.Leverage.src),
      timestamps: { '00:00:00.000': { main: () => image(url.path('advantage.png')) } },
    },
    {
      id: 'advantage.innovate',
      title: `Advantage: Innovate`,
      panel: 'advantage',
      video: v(Economic.Advantage.Innovate.src),
      timestamps: { '00:00:00.000': { main: () => image(url.path('advantage.png')) } },
    },
    // { id: 'example', title: `Example`, video: v(Economic.Example.src), timestamps: {} },
  ],
};
