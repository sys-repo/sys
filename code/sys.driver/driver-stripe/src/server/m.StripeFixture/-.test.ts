import { describe, expect, Fs, it, Net, Testing } from '../../-test.ts';
import { StripeFixture } from './mod.ts';

const STRIPE_SECRET_KEY = `sk_${'test_fixture'}`;
const STRIPE_PUBLISHABLE_KEY = `pk_${'test_fixture'}`;
const CLIENT_SECRET = `pi_${'fixture'}_secret_${'test'}`;

describe('StripeFixture', () => {
  it('API', async () => {
    const m = await import('@sys/driver-stripe/server/fixture');
    expect(m.StripeFixture).to.equal(StripeFixture);
  });

  it('returns 405 for non-POST session requests', async () => {
    const res = await StripeFixture.handle(
      new Request(`http://localhost${StripeFixture.path}`),
      {},
    );
    expect(res?.status).to.eql(405);
    expect(res?.headers.get('allow')).to.eql('POST');
  });

  it('starts → closes as a managed lifecycle', async () => {
    const port = Net.port();
    const server = await StripeFixture.start({ name: 'test:fixture', port, silent: true });

    try {
      expect(server.port).to.eql(port);
      const res = await fetch(`${server.origin}/`);
      const body = await res.json();

      expect(res.status).to.eql(200);
      expect(body.fixture).to.eql('stripe-runtime');
      expect(body.endpoint).to.eql(StripeFixture.path);
    } finally {
      await server.close('test');
    }

    expect(server.disposed).to.eql(true);
  });

  it('reads STRIPE_FIXTURE_PORT from cwd .env at startup', async () => {
    const dir = await Testing.dir('driver-stripe.fixture.port-env');
    await Fs.write(dir.join('.env'), 'STRIPE_FIXTURE_PORT=not-a-port\n');

    try {
      await StripeFixture.start({ cwd: dir.dir, silent: true });
      expect.fail('Expected StripeFixture.start to reject invalid STRIPE_FIXTURE_PORT.');
    } catch (cause) {
      if (!(cause instanceof Error)) throw cause;
      expect(cause.message).to.contain('Invalid STRIPE_FIXTURE_PORT');
    }
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
      expect(String((init?.headers as Record<string, string>).authorization)).to.eql(
        `Bearer ${STRIPE_SECRET_KEY}`,
      );
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

  it('searches upward for workspace-level server-side env', async () => {
    const dir = await Testing.dir('driver-stripe.fixture.session-upward');
    const child = dir.join('cell/instance');
    await Fs.ensureDir(child);
    await Fs.write(
      dir.join('.env'),
      `STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}\nSTRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}\n`,
    );

    const original = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ client_secret: CLIENT_SECRET });

    try {
      const res = await StripeFixture.createSession({ cwd: child });
      const body = await res.json();
      expect(res.status).to.eql(200);
      expect(body.publishableKey).to.eql(STRIPE_PUBLISHABLE_KEY);
      expect(body.clientSecret).to.eql(CLIENT_SECRET);
    } finally {
      globalThis.fetch = original;
    }
  });
});
