import { cose } from '@simplewebauthn/server/helpers';
import { describe, expect, it } from './common.ts';
import { authenticator, config, fixture, registrationPublicKey, value } from './u.fixture.ts';

describe('AccountService configured algorithms', () => {
  for (const label of [-7, -257] as const) {
    it(`Ed25519 key labelled ${label} → refusal without association or capacity publication`, async () => {
      const options = config();
      options.algorithms = [label];
      options.capacity = { accounts: 1, credentials: 1, sessions: 1, transactions: 1 };
      using host = fixture(options);
      const key = await authenticator(-8);
      const begin = value(await host.call('account.create.begin', {}));
      const response = registrationPublicKey(key.registration(begin.options), (publicKey) => {
        publicKey.set(cose.COSEKEYS.alg, label);
      });
      // An allowed outer hint cannot vouch for the inconsistent encoded key.
      Object.assign(response.response, { publicKeyAlgorithm: label });
      const input = { transaction: begin.transaction, response };
      expect(await host.call('account.create.finish', input))
        .to.eql({ kind: 'rejected', code: 'verification-rejected' });
      expect(await host.call('account.create.finish', input))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
      const attempt = value(await host.call('session.signIn.begin', {}));
      expect(
        await host.call('session.signIn.finish', {
          transaction: attempt.transaction,
          response: await key.assertion(attempt.options, begin.options.user.id),
        }),
      ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
      const valid = await authenticator(label);
      const fresh = value(await host.call('account.create.begin', {}));
      value(
        await host.call('account.create.finish', {
          transaction: fresh.transaction,
          response: valid.registration(fresh.options),
        }),
      );
    });
  }
  for (
    const [mutation, parameter, replacement] of [
      ['curve', cose.COSEKEYS.crv, cose.COSECRV.P384],
      ['type', cose.COSEKEYS.kty, cose.COSEKTY.OKP],
      ['coordinate', cose.COSEKEYS.x, new Uint8Array(31)],
    ] as const
  ) {
    it(`ES256 inconsistent ${mutation} → refusal before credential admission`, async () => {
      const options = config();
      options.algorithms = [-7];
      using host = fixture(options);
      const key = await authenticator(-7);
      const begin = value(await host.call('account.create.begin', {}));
      const response = registrationPublicKey(key.registration(begin.options), (publicKey) => {
        publicKey.set(parameter, replacement);
      });
      expect(await host.call('account.create.finish', { transaction: begin.transaction, response }))
        .to.eql({ kind: 'rejected', code: 'verification-rejected' });
    });
  }

  it('unusable ES256 point → refusal, consumed attempt, no credential association', async () => {
    const options = config();
    options.algorithms = [-7];
    options.capacity = { accounts: 1, credentials: 1, sessions: 1, transactions: 1 };
    using host = fixture(options);
    const key = await authenticator(-7);
    const begin = value(await host.call('account.create.begin', {}));
    const response = registrationPublicKey(key.registration(begin.options), (publicKey) => {
      publicKey.set(cose.COSEKEYS.x, new Uint8Array(32));
      publicKey.set(cose.COSEKEYS.y, new Uint8Array(32));
    });
    const input = { transaction: begin.transaction, response };
    expect(await host.call('account.create.finish', input))
      .to.eql({ kind: 'rejected', code: 'verification-rejected' });
    expect(await host.call('account.create.finish', input))
      .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    const unknown = value(await host.call('session.signIn.begin', {}));
    expect(
      await host.call('session.signIn.finish', {
        transaction: unknown.transaction,
        response: await key.assertion(unknown.options, begin.options.user.id),
      }),
    ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
    const fresh = value(await host.call('account.create.begin', {}));
    value(
      await host.call('account.create.finish', {
        transaction: fresh.transaction,
        response: key.registration(fresh.options),
      }),
    );
  });

  for (const algorithm of [-7, -8, -257] as const) {
    it(`${algorithm} → native signature accepted; corrupted signature rejected`, async () => {
      const options = config();
      options.algorithms = [algorithm];
      using host = fixture(options);
      const key = await authenticator(algorithm);
      const begin = value(await host.call('account.create.begin', {}));
      expect(begin.options.pubKeyCredParams).to.eql([{ type: 'public-key', alg: algorithm }]);
      value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      const signIn = value(await host.call('session.signIn.begin', {}));
      value(
        await host.call('session.signIn.finish', {
          transaction: signIn.transaction,
          response: await key.assertion(signIn.options, begin.options.user.id),
        }),
      );
      const bad = value(await host.call('session.signIn.begin', {}));
      expect(
        await host.call('session.signIn.finish', {
          transaction: bad.transaction,
          response: await key.assertion(bad.options, begin.options.user.id, { badSignature: true }),
        }),
      ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
    });
  }
});
