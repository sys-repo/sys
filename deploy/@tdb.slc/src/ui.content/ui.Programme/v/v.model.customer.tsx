import { type t, VIDEO } from './common.ts';
import { Dir, image, v } from './u.tsx';

const Customer = VIDEO.Model.Customer;
const dir = Dir.programme.dir('model.customer');

export const customer: t.VideoMediaContent = {
  id: 'model.customer',
  title: 'Customer Model',
  panel: ['problem', 'solution', 'uvp', 'customers'],
  video: v(Customer.Entry.src),
  timestamps: {
    '00:00:00.000': { main: () => image(dir.path('customer-model.png')) },
    '00:00:12.000': { main: () => image(dir.path('model-overview.png')) },
    '00:00:14.000': { main: () => image(dir.path('model-customers.png')) },
    '00:00:15.000': { main: () => image(dir.path('model-jobs.png')) },
    '00:00:16.000': { main: () => image(dir.path('model-uvp.png')) },
    '00:00:21.000': { main: () => image(dir.path('model-solution.png')) },
    '00:00:26.000': { main: () => image(dir.path('model-overview.png')) },
  },
  children: [
    {
      id: 'customers',
      title: `Customers`,
      video: v(Customer.Customers.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('model-customers.png')) } },
    },
    {
      id: 'segments',
      title: `Customer Segments`,
      video: v(Customer.Segments.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('model-customers.png')) } },
    },
    {
      id: 'early-adopters',
      title: `Early Adopters`,
      video: v(Customer.EarlyAdopters.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('model-customers.png')) } },
    },
    {
      id: 'jobs',
      title: `Jobs to be Done`,
      video: v(Customer.Jobs.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('model-jobs.png')) } },
    },
    {
      id: 'alternatives',
      title: `Existing Alternatives`,
      video: v(Customer.Alternatives.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('model-jobs.png')) } },
    },
    {
      id: 'uvp',
      title: `Unique Value Proposition`,
      video: v(Customer.UVP.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('model-uvp.png')) } },
    },
    {
      id: 'solution',
      title: `Solution`,
      video: v(Customer.Solution.src),
      timestamps: { '00:00:00.000': { main: () => image(dir.path('model-solution.png')) } },
    },
  ],
};
