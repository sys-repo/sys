import { Accounts } from '../../m.Accounts/mod.ts';
import { verifier } from '../u/u.verifier.ts';
import { beforeAll, describe, expect, it, type t, Try, WebFixture } from './common.ts';
import { authenticator, config, fixture, value } from './u.fixture.ts';

let key: t.Authenticator;
let extra: t.Authenticator;

describe('AccountService reservation and commit', () => {
  beforeAll(async () => {
    key = await authenticator();
    extra = await authenticator();
  });

  it('concurrent finish → one verifier call and one commit', async () => {
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let calls = 0;
    using host = fixture(config(), {
      verifier: {
        ...verifier,
        async registration(...args) {
          calls++;
          const result = await verifier.registration(...args);
          entered.resolve();
          await release.promise;
          return result;
        },
      },
    });
    const begin = value(await host.call('account.create.begin', {}));
    const input = { transaction: begin.transaction, response: key.registration(begin.options) };
    const first = host.call('account.create.finish', input);
    await entered.promise;
    expect(await host.call('account.create.finish', input))
      .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    expect(calls).to.equal(1);
    release.resolve();
    const grant = value(await first);
    expect(grant.session.account.credentialCount).to.equal(1);
  });

  it('distinct registrations finishing in reverse order → both authorities survive', async () => {
    const gates = [key, extra].map(() => ({
      entered: Promise.withResolvers<void>(),
      release: Promise.withResolvers<void>(),
    }));
    let count = 0;
    using host = fixture(config(), {
      verifier: {
        ...verifier,
        async registration(...args) {
          const gate = gates[count++];
          const result = await verifier.registration(...args);
          gate.entered.resolve();
          await gate.release.promise;
          return result;
        },
      },
    });
    const a = value(await host.call('account.create.begin', {}));
    const b = value(await host.call('account.create.begin', {}));
    const first = host.call('account.create.finish', {
      transaction: a.transaction,
      response: key.registration(a.options),
    });
    await gates[0].entered.promise;
    const second = host.call('account.create.finish', {
      transaction: b.transaction,
      response: extra.registration(b.options),
    });
    await gates[1].entered.promise;
    gates[1].release.resolve();
    const grantB = value(await second);
    gates[0].release.resolve();
    const grantA = value(await first);
    expect(grantA.session.account.principal).not.to.equal(grantB.session.account.principal);
    for (const [credential, grant, begin] of [[key, grantA, a], [extra, grantB, b]] as const) {
      expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
      const attempt = value(await host.call('session.signIn.begin', {}));
      const returned = value(
        await host.call('session.signIn.finish', {
          transaction: attempt.transaction,
          response: await credential.assertion(attempt.options, begin.options.user.id),
        }),
      );
      expect(returned.session.account).to.eql(grant.session.account);
    }
  });

  it('sign-in verification → concurrent revocation stays revoked after publication', async () => {
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const options = config();
    options.capacity.sessions = 1;
    using host = fixture(options, {
      verifier: {
        ...verifier,
        async authentication(...args) {
          const result = await verifier.authentication(...args);
          entered.resolve();
          await release.promise;
          return result;
        },
      },
    });
    const begin = value(await host.call('account.create.begin', {}));
    const grant = value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: key.registration(begin.options),
      }),
    );
    const attempt = value(await host.call('session.signIn.begin', {}));
    const pending = host.call('session.signIn.finish', {
      transaction: attempt.transaction,
      response: await key.assertion(attempt.options, begin.options.user.id, { counter: 1 }),
    });
    await entered.promise;
    value(await host.call('session.revoke', {}, grant.credential));
    release.resolve();
    const returned = value(await pending);
    expect(value(await host.call('session.inspect', {}, grant.credential))).to.equal(null);
    expect(value(await host.call('session.inspect', {}, returned.credential)))
      .to.eql(returned.session);
  });

  for (const counters of [[1, 2], [2, 1], [0, 0]]) {
    it(`assertions ${counters.join('/')} finishing in reverse order → stale completion rejected`, async () => {
      const gates = counters.map(() => ({
        entered: Promise.withResolvers<void>(),
        release: Promise.withResolvers<void>(),
      }));
      let count = 0;
      using host = fixture(config(), {
        verifier: {
          ...verifier,
          async authentication(...args) {
            const gate = gates[count++];
            const result = await verifier.authentication(...args);
            gate.entered.resolve();
            await gate.release.promise;
            return result;
          },
        },
      });
      const begin = value(await host.call('account.create.begin', {}));
      value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      const a = value(await host.call('session.signIn.begin', {}));
      const b = value(await host.call('session.signIn.begin', {}));
      const responseA = await key.assertion(a.options, begin.options.user.id, {
        counter: counters[0],
      });
      const responseB = await key.assertion(b.options, begin.options.user.id, {
        counter: counters[1],
      });
      const first = host.call('session.signIn.finish', {
        transaction: a.transaction,
        response: responseA,
      });
      await gates[0].entered.promise;
      const second = host.call('session.signIn.finish', {
        transaction: b.transaction,
        response: responseB,
      });
      await gates[1].entered.promise;
      gates[1].release.resolve();
      value(await second);
      gates[0].release.resolve();
      expect(await first).to.eql({ kind: 'rejected', code: 'state-changed' });
      expect(count).to.equal(2);
    });
  }

  for (const terminal of ['revoke', 'expire'] as const) {
    it(`enrollment verification → initiating session ${terminal} → no credential commit`, async () => {
      const options = config();
      options.lifetimes = { challenge: 10_000, session: 100 };
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      let hold = false;
      using host = fixture(options, {
        verifier: {
          ...verifier,
          async registration(...args) {
            const result = await verifier.registration(...args);
            if (hold) {
              entered.resolve();
              await release.promise;
            }
            return result;
          },
        },
      });
      const begin = value(await host.call('account.create.begin', {}));
      const grant = value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      const add = value(await host.call('passkey.add.begin', {}, grant.credential));
      hold = true;
      const pending = host.call('passkey.add.finish', {
        transaction: add.transaction,
        response: extra.registration(add.options),
      }, grant.credential);
      await entered.promise;
      if (terminal === 'revoke') await host.call('session.revoke', {}, grant.credential);
      else host.clock.now += 100;
      release.resolve();
      expect(await pending).to.eql({ kind: 'rejected', code: 'no-session' });
      const attempt = value(await host.call('session.signIn.begin', {}));
      expect(
        await host.call('session.signIn.finish', {
          transaction: attempt.transaction,
          response: await extra.assertion(attempt.options, begin.options.user.id),
        }),
      ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
    });
  }

  it('claimed expired work retains capacity until it settles', async () => {
    const options = config();
    options.capacity.transactions = 1;
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    using host = fixture(options, {
      verifier: {
        ...verifier,
        async registration(...args) {
          const result = await verifier.registration(...args);
          entered.resolve();
          await release.promise;
          return result;
        },
      },
    });
    const begin = value(await host.call('account.create.begin', {}));
    const pending = host.call('account.create.finish', {
      transaction: begin.transaction,
      response: key.registration(begin.options),
    });
    await entered.promise;
    host.clock.now += options.lifetimes.challenge;
    expect(await host.call('account.create.begin', {})).to.eql({
      kind: 'rejected',
      code: 'capacity',
    });
    release.resolve();
    expect(await pending).to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    value(await host.call('account.create.begin', {}));
  });

  it('disposal during verification → no late authority and fixed failure', async () => {
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    using host = fixture(config(), {
      verifier: {
        ...verifier,
        async registration(...args) {
          const result = await verifier.registration(...args);
          entered.resolve();
          await release.promise;
          return result;
        },
      },
    });
    const begin = value(await host.call('account.create.begin', {}));
    const pending = host.call('account.create.finish', {
      transaction: begin.transaction,
      response: key.registration(begin.options),
    });
    await entered.promise;
    host.service.dispose();
    host.service[Symbol.dispose]();
    release.resolve();
    const completion = (await Try.run(() => pending)).result;
    expect(completion.ok).to.equal(false);
    if (!completion.ok) expect(completion.error.message).to.equal('Account service failed.');
    const inspection = (await Try.run(() => host.call('session.inspect', {}))).result;
    expect(inspection.ok).to.equal(false);
    if (!inspection.ok) expect(inspection.error.message).to.equal('Account service failed.');
  });

  for (const operation of ['create', 'signIn', 'add'] as const) {
    it(`${operation} expiry during synchronous preparation → no authority publication`, async () => {
      const options = config();
      options.lifetimes = { challenge: 60_000, session: operation === 'add' ? 100 : 300_000 };
      options.capacity.sessions = 2;
      using host = fixture(options);
      const finishName = operation === 'create'
        ? 'account.create.finish'
        : operation === 'signIn'
        ? 'session.signIn.finish'
        : 'passkey.add.finish';
      const original = Accounts.readResult;
      let expiresAt = 0;
      let prepared = false;
      const readResult: t.Accounts.Lib['readResult'] = (name, input) => {
        const result = original(name, input);
        if (name === finishName) {
          expect(result?.kind).to.equal('accepted');
          expect(host.clock.now).to.be.lessThan(expiresAt);
          host.clock.now = expiresAt;
          prepared = true;
        }
        return result;
      };
      const begin = value(await host.call('account.create.begin', {}));
      const handle = begin.options.user.id;
      {
        // Expire during successful result preparation, not after an incidental number of clock reads.
        using _mock = WebFixture.Property.mock([{
          target: Accounts,
          key: 'readResult',
          descriptor: { value: readResult },
        }]);
        expiresAt = begin.expiresAt;
        const creation = await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        });
        if (operation === 'create') {
          expect(creation).to.eql({ kind: 'rejected', code: 'invalid-transaction' });
        } else {
          const grant = value(creation);
          if (operation === 'signIn') {
            const attempt = value(await host.call('session.signIn.begin', {}));
            expiresAt = attempt.expiresAt;
            expect(
              await host.call('session.signIn.finish', {
                transaction: attempt.transaction,
                response: await key.assertion(attempt.options, handle, { counter: 1 }),
              }),
            ).to.eql({ kind: 'rejected', code: 'invalid-transaction' });
          } else {
            const add = value(await host.call('passkey.add.begin', {}, grant.credential));
            expiresAt = grant.session.expiresAt;
            expect(
              await host.call('passkey.add.finish', {
                transaction: add.transaction,
                response: extra.registration(add.options),
              }, grant.credential),
            ).to.eql({ kind: 'rejected', code: 'no-session' });
          }
        }
      }
      expect(prepared).to.equal(true);
      if (operation === 'create') {
        const fresh = value(await host.call('account.create.begin', {}));
        value(
          await host.call('account.create.finish', {
            transaction: fresh.transaction,
            response: key.registration(fresh.options),
          }),
        ); // The refused creation did not reserve this credential globally.
      } else {
        const fresh = value(await host.call('session.signIn.begin', {}));
        const response = await (operation === 'add' ? extra : key).assertion(
          fresh.options,
          handle,
          { counter: 1 },
        );
        const proof = await host.call('session.signIn.finish', {
          transaction: fresh.transaction,
          response,
        });
        if (operation === 'add') {
          expect(proof).to.eql({ kind: 'rejected', code: 'verification-rejected' });
        } else value(proof); // Neither the counter nor a capacity-consuming session was published.
      }
    });
  }

  it('verifier defect → sanitized failure, not rejection, and no retry of the consumed transaction', async () => {
    using host = fixture(config(), {
      verifier: {
        ...verifier,
        registration() {
          throw new Error('SECRET_VERIFIER_FAILURE');
        },
      },
    });
    const begin = value(await host.call('account.create.begin', {}));
    const input = { transaction: begin.transaction, response: key.registration(begin.options) };
    const completion = (await Try.run(() => host.call('account.create.finish', input))).result;
    expect(completion.ok).to.equal(false);
    if (completion.ok) throw new Error('Expected service failure');
    expect(completion.error.message).to.equal('Account service failed.');
    expect(completion.error.stack).to.equal(undefined);
    expect(completion.error.cause).to.equal(undefined);
    expect(await host.call('account.create.finish', input))
      .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
  });
});
