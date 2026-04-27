import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { StripeFixture } from './mod.ts';

const STRIPE_SECRET_KEY = `sk_${'test_fixture'}`;
const STRIPE_PUBLISHABLE_KEY = `pk_${'test_fixture'}`;
const CLIENT_SECRET = `pi_${'fixture'}_secret_${'test'}`;

describe('StripeFixture', () => {
  it('returns 405 for non-POST session requests', async () => {
    const res = await StripeFixture.handle(new Request(`http://localhost${StripeFixture.path}`), {});
    expect(res?.status).to.eql(405);
    expect(res?.headers.get('allow')).to.eql('POST');
  });

  it('fails closed when server-side Stripe env is missing', async () => {
    const dir = await Testing.dir('driver-stripe.fixture.missing-env');
    const res = await StripeFixture.createSession({ cwd: dir.dir });
    const body = await res.json();

    expect(res.status).to.eql(503);
    expect(body.publishableKey).to.eql(undefined);
    expect(body.clientSecret).to.eql(undefined);
    expect(body.error).to.contain('not configured');
  });

  it('mints a runtime session from server-side env', async () => {
    const dir = await Testing.dir('driver-stripe.fixture.session');
    await Fs.write(
      dir.join('.env'),
      `STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}\nSTRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}\n`,
    );

    const original = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      expect(String(input)).to.eql('https://api.stripe.com/v1/payment_intents');
      expect(init?.method).to.eql('POST');
      expect(String((init?.headers as Record<string, string>).authorization)).to.eql(`Bearer ${STRIPE_SECRET_KEY}`);
      return Response.json({ client_secret: CLIENT_SECRET });
    };

    try {
      const res = await StripeFixture.createSession({ cwd: dir.dir });
      const body = await res.json();
      expect(res.status).to.eql(200);
      expect(body.publishableKey).to.eql(STRIPE_PUBLISHABLE_KEY);
      expect(body.clientSecret).to.eql(CLIENT_SECRET);
    } finally {
      globalThis.fetch = original;
    }
  });
});
