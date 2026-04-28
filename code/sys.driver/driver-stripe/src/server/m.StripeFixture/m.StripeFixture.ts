import type { t } from '../common.ts';
import { createSession } from './u.session.ts';
import { start } from './u.start.ts';
import { methodNotAllowed, path } from './u.route.ts';
import { serve } from './u.serve.ts';

export const StripeFixture: t.StripeFixture.Lib = {
  path,
  createSession,
  async handle(req, args) {
    const url = new URL(req.url);
    if (url.pathname !== path) return undefined;
    if (req.method !== 'POST') return methodNotAllowed('POST');
    return await createSession(args);
  },
  start,
  serve,
};
