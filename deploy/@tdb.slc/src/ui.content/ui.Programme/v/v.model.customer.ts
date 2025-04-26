import { type t, VIDEO } from './common.ts';
import { DUMMY, v } from './u.ts';

export const customer: t.VideoMediaContent = {
  id: 'model.customer',
  title: 'Customer Model',
  video: v(VIDEO.Model.Customer.Customers.src),
  timestamps: {},
  children: [
    { id: 'customers', title: `Customers`, video: v(DUMMY), timestamps: {} },
    { id: 'segments', title: `Customer Segments`, video: v(DUMMY), timestamps: {} },
    { id: 'early-adopters', title: `Early Adopters`, video: v(DUMMY), timestamps: {} },
    { id: 'jobs', title: `Jobs to be Done`, video: v(DUMMY), timestamps: {} },
    {
      id: 'alternatives',
      title: `Existing Alternatives`,
      video: v(DUMMY),
      timestamps: {},
    },
    {
      id: 'uvp',
      title: `Unique Value Proposition`,
      video: v(DUMMY),
      timestamps: {},
    },
    { id: 'solution', title: `Solution`, video: v(DUMMY), timestamps: {} },
    { id: 'example', title: `Example`, video: v(DUMMY), timestamps: {} },
  ],
};
