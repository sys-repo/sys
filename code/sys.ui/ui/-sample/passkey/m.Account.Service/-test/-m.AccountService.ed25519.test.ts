import { cose } from '@simplewebauthn/server/helpers';
import { Curves, describe, expect, it, type t, Try, WebFixture } from './common.ts';
import { authenticator, config, fixture, registrationPublicKey, value } from './u.fixture.ts';

// The crypto owner proves subgroup arithmetic; these exercise the service's admission/publication seam.
const inadmissible = [
  ['off-curve y=2', new Uint8Array([2, ...new Uint8Array(31)])],
  ['identity', new Uint8Array([1, ...new Uint8Array(31)])],
  ['small-order y=0', new Uint8Array(32)],
  ['noncanonical y=p', new Uint8Array([237, ...new Uint8Array(30).fill(255), 127])],
] as const;

describe('AccountService strict Ed25519 admission', () => {
  for (const purpose of ['create', 'add'] as const) {
    for (const [label, bytes] of inadmissible) {
      it(`${purpose}: ${label} → refusal, consumed attempt, same-ID recovery`, async () => {
        const options = config();
        options.algorithms = [-8];
        options.capacity = {
          accounts: 1,
          credentials: purpose === 'create' ? 1 : 2,
          sessions: 2,
          transactions: 1,
        };
        using host = fixture(options);
        const key = await authenticator(-8);
        const owner = await authenticator(-8);
        let grant: t.Accounts.Grant | undefined;
        if (purpose === 'add') {
          const begin = value(await host.call('account.create.begin', {}));
          grant = value(
            await host.call('account.create.finish', {
              transaction: begin.transaction,
              response: owner.registration(begin.options),
            }),
          );
        }
        const beginName = purpose === 'create' ? 'account.create.begin' : 'passkey.add.begin';
        const finishName = purpose === 'create' ? 'account.create.finish' : 'passkey.add.finish';
        const begin = value(await host.call(beginName, {}, grant?.credential));
        const response = registrationPublicKey(key.registration(begin.options), (publicKey) => {
          publicKey.set(cose.COSEKEYS.x, bytes.slice());
        });
        const input = { transaction: begin.transaction, response };
        expect(await host.call(finishName, input, grant?.credential))
          .to.eql({ kind: 'rejected', code: 'verification-rejected' });
        expect(await host.call(finishName, input, grant?.credential))
          .to.eql({ kind: 'rejected', code: 'invalid-transaction' });

        // Public follow-ups, not counts alone, prove no hidden association or capacity leak.
        const unknown = value(await host.call('session.signIn.begin', {}));
        expect(
          await host.call('session.signIn.finish', {
            transaction: unknown.transaction,
            response: await key.assertion(unknown.options, begin.options.user.id),
          }),
        ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
        if (grant) {
          expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(
            grant.session,
          );
        }
        const fresh = value(await host.call(beginName, {}, grant?.credential));
        if (grant) {
          expect(fresh.options.excludeCredentials?.map((item) => item.id)).to.eql([owner.id]);
        }
        const recovered = value<t.Accounts.Grant | t.Accounts.Session>(
          await host.call(finishName, {
            transaction: fresh.transaction,
            response: key.registration(fresh.options),
          }, grant?.credential),
        );
        if (grant) {
          expect(recovered).to.eql({
            ...grant.session,
            account: { ...grant.session.account, credentialCount: 2 },
          });
        }
        const signIn = value(await host.call('session.signIn.begin', {}));
        const signedIn = value(
          await host.call('session.signIn.finish', {
            transaction: signIn.transaction,
            response: await key.assertion(signIn.options, fresh.options.user.id),
          }),
        );
        expect(signedIn.session.account.credentialCount).to.equal(purpose === 'create' ? 1 : 2);
        if (grant) {
          expect(signedIn.session.account.principal).to.equal(grant.session.account.principal);
        }
      });
    }

    const defects = [
      new Error('UNEXPECTED_CURVE_FAILURE'),
      new TypeError('bad point: invalid y coordinate'),
    ];
    for (const defect of defects) {
      it(`${purpose}: curve-engine ${defect.name} fault → sanitized failure, not refusal`, async () => {
        const options = config();
        options.algorithms = [-8];
        options.capacity = {
          accounts: 1,
          credentials: purpose === 'create' ? 1 : 2,
          sessions: 2,
          transactions: 1,
        };
        using host = fixture(options);
        const key = await authenticator(-8);
        let grant: t.Accounts.Grant | undefined;
        if (purpose === 'add') {
          const owner = await authenticator(-8);
          const begin = value(await host.call('account.create.begin', {}));
          grant = value(
            await host.call('account.create.finish', {
              transaction: begin.transaction,
              response: owner.registration(begin.options),
            }),
          );
        }
        const beginName = purpose === 'create' ? 'account.create.begin' : 'passkey.add.begin';
        const finishName = purpose === 'create' ? 'account.create.finish' : 'passkey.add.finish';
        const begin = value(await host.call(beginName, {}, grant?.credential));
        const input = { transaction: begin.transaction, response: key.registration(begin.options) };
        let injected = false;
        {
          // Pinned engine control: integer conversion is the fault seam, not a service contract.
          using _mock = WebFixture.Property.mock([{
            target: globalThis,
            key: 'BigInt',
            descriptor: {
              configurable: true,
              value: new Proxy(BigInt, {
                apply() {
                  injected = true;
                  throw defect;
                },
              }),
            },
          }]);
          expect(() => Curves.Ed25519.isValidPublicKey(new Uint8Array(32))).to.throw(defect);
          expect(injected).to.equal(true);
          injected = false;
          const completion = (await Try.run(() =>
            host.call(finishName, input, grant?.credential)
          )).result;
          expect(injected).to.equal(true);
          expect(completion.ok).to.equal(false);
          if (completion.ok) throw new Error('Expected service failure');
          expect(completion.error.message).to.equal('Account service failed.');
          expect(completion.error.stack).to.equal(undefined);
          expect(completion.error.cause).to.equal(undefined);
        }
        expect(await host.call(finishName, input, grant?.credential))
          .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
        if (grant) {
          expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(
            grant.session,
          );
        }
        const fresh = value(await host.call(beginName, {}, grant?.credential));
        value<t.Accounts.Grant | t.Accounts.Session>(
          await host.call(finishName, {
            transaction: fresh.transaction,
            response: key.registration(fresh.options),
          }, grant?.credential),
        );
        const signIn = value(await host.call('session.signIn.begin', {}));
        const signedIn = value(
          await host.call('session.signIn.finish', {
            transaction: signIn.transaction,
            response: await key.assertion(signIn.options, fresh.options.user.id),
          }),
        );
        expect(signedIn.session.account.credentialCount).to.equal(purpose === 'create' ? 1 : 2);
      });
    }
  }
});
