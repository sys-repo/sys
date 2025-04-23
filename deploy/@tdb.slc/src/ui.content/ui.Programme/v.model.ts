import { customer } from './v.model.customer.ts';
import { econ } from './v.model.econ.ts';
import { impact } from './v.model.impact.ts';

export { customer, econ, impact };
export const model = { customer, econ, impact } as const;
