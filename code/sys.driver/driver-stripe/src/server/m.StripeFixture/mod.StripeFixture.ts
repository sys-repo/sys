import { createSession } from './u.session.ts';
import { serve } from './u.serve.ts';
import type { t } from '../common.ts';

const path: t.StripeFixture.Lib['path'] = '/-/stripe/payment-intent';

export const StripeFixture: t.StripeFixture.Lib = {
  path,
  createSession,
  async handle(req, args) {
    const url = new URL(req.url);
    if (url.pathname !== path) return undefined;
    if (req.method !== 'POST') return methodNotAllowed('POST');
    return await createSession(args);
  },
  serve,
};

export function methodNotAllowed(allow: string) {
  return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { allow } });
}
