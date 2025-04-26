import { type t, VIDEO } from './common.ts';
import { v } from './u.ts';

const Customer = VIDEO.Model.Customer;

export const customer: t.VideoMediaContent = {
  id: 'model.customer',
  title: 'Customer Model',
  video: v(Customer.Entry.src),
  timestamps: {},
  children: [
    { id: 'customers', title: `Customers`, video: v(Customer.Customers.src), timestamps: {} },
    {
      id: 'segments',
      title: `Customer Segments`,
      video: v(Customer.Segments.src),
      timestamps: {},
    },
    {
      id: 'early-adopters',
      title: `Early Adopters`,
      video: v(Customer.EarlyAdopters.src),
      timestamps: {},
    },
    { id: 'jobs', title: `Jobs to be Done`, video: v(Customer.Jobs.src), timestamps: {} },
    {
      id: 'alternatives',
      title: `Existing Alternatives`,
      video: v(Customer.Alternatives.src),
      timestamps: {},
    },
    {
      id: 'uvp',
      title: `Unique Value Proposition`,
      video: v(Customer.UVP.src),
      timestamps: {},
    },
    { id: 'solution', title: `Solution`, video: v(Customer.Solution.src), timestamps: {} },
  ],
};
