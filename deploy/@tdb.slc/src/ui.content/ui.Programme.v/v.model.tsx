import { customer } from './v.model.customer.tsx';
import { econ } from './v.model.econ.tsx';
import { impact } from './v.model.impact.tsx';

export { customer, econ, impact };
export const model = { customer, econ, impact } as const;
