import { Num, Schema } from './common.ts';

const { Type: T } = Schema;
const strict = { additionalProperties: false };
const text = T.String({ minLength: 1 });
const positive = T.Integer({ minimum: 1, maximum: Num.MAX_INT });

export const PolicySchema = T.Object({
  rp: T.Object({ id: text, name: text }, strict),
  origins: T.Array(text, { minItems: 1, uniqueItems: true }),
  algorithms: T.Array(T.Integer({ minimum: Num.MIN_INT, maximum: Num.MAX_INT }), {
    minItems: 1,
    uniqueItems: true,
  }),
  lifetimes: T.Object({ challenge: positive, session: positive }, strict),
  capacity: T.Object({
    accounts: positive,
    credentials: positive,
    transactions: positive,
    sessions: positive,
  }, strict),
}, strict);
