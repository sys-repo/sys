import { HttpCmd } from '@sys/http/cmd';
import { describe, expect, it, type t, Try } from './common.ts';
import { authenticator, fixture, value } from './u.fixture.ts';

/** In-memory Request/Response binding only: no listener, cookie, or deployment configuration. */
describe('AccountService over bounded HttpCmd', () => {
  it('lost successful create response → uncertain dispatch, no retry, explicit fresh sign-in', async () => {
    using host = fixture();
    const key = await authenticator();
    const policy = { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 };
    let loseResponse = false;
    let requests = 0;
    using client = HttpCmd.client<t.Accounts.Name, t.Accounts.Payload, t.Accounts.Result>({
      url: 'https://accounts.example.test/cmd',
      ns: 'accounts',
      policy,
      async fetch(input, init) {
        requests++;
        const request = new Request(input, init);
        const header = request.headers.get('authorization');
        const credential = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
        const response = await HttpCmd.handle(request, {
          path: '/cmd',
          policy,
          cmd: { ns: 'accounts', handlers: host.service.handlers({ credential }) },
        });
        if (loseResponse) {
          await response.body?.cancel();
          throw new Error('SECRET_RESPONSE_FAILURE');
        }
        return response;
      },
    });
    const begin = value(await client.send('account.create.begin', {}));
    loseResponse = true;
    const input = { transaction: begin.transaction, response: key.registration(begin.options) };
    const { result } = await Try.run(() => client.send('account.create.finish', input));
    expect(result.ok).to.equal(false);
    if (result.ok) throw new Error('Expected transport failure');
    const error = result.error as t.HttpCmd.Error;
    expect(error.kind).to.equal('network');
    expect(error.dispatch).to.equal('possible');
    expect(error.message).to.equal('HTTP command failed: network.');
    expect(error.cause).to.equal(undefined);
    expect(requests).to.equal(2); // No automatic mutation retry.
    loseResponse = false;
    expect(await client.send('account.create.finish', input))
      .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    expect(value(await client.send('session.inspect', {}))).to.equal(null);
    const attempt = value(await client.send('session.signIn.begin', {}));
    const grant = value(
      await client.send('session.signIn.finish', {
        transaction: attempt.transaction,
        response: await key.assertion(attempt.options, begin.options.user.id),
      }),
    );
    expect(value(
      await client.send('session.inspect', {}, {
        headers: { Authorization: `Bearer ${grant.credential}` },
      }),
    )).to.eql(grant.session);
    await client.send('session.revoke', {}, {
      headers: { Authorization: `Bearer ${grant.credential}` },
    });
    expect(value(
      await client.send('session.inspect', {}, {
        headers: { Authorization: `Bearer ${grant.credential}` },
      }),
    )).to.equal(null);
  });
});
