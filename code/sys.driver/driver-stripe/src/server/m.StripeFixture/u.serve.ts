import type { t } from '../common.ts';
import { start } from './u.start.ts';

type F = t.StripeFixture.Lib['serve'];

export const serve: F = async (args = {}) => {
  const server = await start(args);
  await server.finished;
};
