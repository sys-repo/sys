import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { Accounts } from '../mod.ts';

type InspectHandler = t.Cmd.Handler.Map<
  t.Accounts.Name,
  t.Accounts.Payload,
  t.Accounts.Result
>['session.inspect'];

/** Compile-time consumers plus decoded-result consumption, not a fake authentication service. */
describe('Accounts consumers', () => {
  it('Cmd metadata → literal wire namespace, frozen at runtime', () => {
    expectTypeOf<'accounts'>(Accounts.Cmd.ns);
    expect(Accounts.Cmd.ns).to.eql('accounts');
    expect(Object.isFrozen(Accounts.Cmd)).to.eql(true);
  });

  it('registration response → required native members without fallback narrowing', () => {
    type Response = t.Accounts.Wire.Registration['response'];
    const response: Response = {
      clientDataJSON: 'AQID',
      attestationObject: 'BAUG',
      authenticatorData: 'BwgJ',
      transports: [],
      publicKeyAlgorithm: -7,
    };
    const { authenticatorData, transports, publicKeyAlgorithm, ...base } = response;
    expectTypeOf<Base64URLString>(authenticatorData);
    expectTypeOf<string[]>(transports);
    expectTypeOf<COSEAlgorithmIdentifier>(publicKeyAlgorithm);

    // @ts-expect-error Native registration JSON requires authenticatorData.
    expectTypeOf<Response>({ ...base, transports, publicKeyAlgorithm });
    // @ts-expect-error Native registration JSON requires transports, even when empty.
    expectTypeOf<Response>({ ...base, authenticatorData, publicKeyAlgorithm });
    // @ts-expect-error Native registration JSON requires publicKeyAlgorithm without publicKey.
    expectTypeOf<Response>({ ...base, authenticatorData, transports });
  });

  it('unary Cmd handler → domain decoder → exhaustive client observation', async () => {
    const inspect: InspectHandler = () => ({ kind: 'accepted', value: null });
    const reply = await inspect({}, {
      id: 'req-test',
      name: 'session.inspect',
      signal: new AbortController().signal,
      emit() {},
    });
    const decoded = Accounts.readResult('session.inspect', reply);
    if (!decoded) throw new Error('Expected domain reply');
    expect(observe(decoded)).to.equal('absent');
    expect(observe({
      kind: 'accepted',
      value: {
        account: { principal: 'account.test', label: 'Test account', credentialCount: 1 },
        expiresAt: 1_700_000_000_000,
      },
    })).to.equal('account.test');
    expect(observe({ kind: 'rejected', code: 'invalid-request' })).to.equal('rejected');
    expect(observe({ kind: 'not-submitted', reason: 'unavailable' })).to.equal('not checked');
    expect(observe({ kind: 'indeterminate' })).to.equal('unknown');
  });
});

function observe(attempt: t.Accounts.Attempt<'session.inspect'>): string {
  switch (attempt.kind) {
    case 'accepted':
      return attempt.value?.account.principal ?? 'absent';
    case 'rejected':
      return 'rejected';
    case 'not-submitted':
      return 'not checked';
    case 'indeterminate':
      return 'unknown';
    default: {
      const exhaustive: never = attempt;
      return exhaustive;
    }
  }
}
