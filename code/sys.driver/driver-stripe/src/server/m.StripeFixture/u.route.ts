import type { t } from '../common.ts';

export const path: t.StripeFixture.Lib['path'] = '/-/stripe/payment-intent';

export function methodNotAllowed(allow: string) {
  return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { allow } });
}
