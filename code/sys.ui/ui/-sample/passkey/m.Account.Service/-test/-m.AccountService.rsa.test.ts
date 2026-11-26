import {
  cose,
  isoBase64URL,
  isoCBOR,
  parseAuthenticatorData,
  verifySignature,
} from '@simplewebauthn/server/helpers';
import { beforeAll, describe, expect, Is, it, type t, Try, WebFixture } from './common.ts';
import { authenticator, config, fixture, registrationPublicKey, value } from './u.fixture.ts';

let key: t.Authenticator;
let owner: t.Authenticator;

const malformedKey = 'public key error: SPKI cryptographic key data malformed';

describe('AccountService RSA admission', () => {
  beforeAll(async () => {
    key = await authenticator();
    owner = await authenticator();
  });

  it('public verification decoder distinguishes unusable RSA from an invalid signature', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    const response = key.registration(begin.options);
    const original = registrationKey(response);
    expect(
      await verifySignature({
        credentialPublicKey: original,
        signature: new Uint8Array(256),
        data: new Uint8Array([0]),
      }),
    ).to.equal(false);
    const invalid = registrationKey(withParameter(response, cose.COSEKEYS.e, [0]));
    const completion = (await Try.run(() =>
      verifySignature({
        credentialPublicKey: invalid,
        signature: new Uint8Array(256),
        data: new Uint8Array([0]),
      })
    )).result;
    expect(completion.ok).to.equal(false);
    if (completion.ok) throw new Error('Expected native key rejection');
    expect(completion.error.constructor).to.equal(Error);
    expect(completion.error.message).to.equal(malformedKey);
  });

  for (const purpose of ['create', 'add'] as const) {
    for (
      const [label, parameter, bytes] of [
        ['zero exponent', cose.COSEKEYS.e, [0]],
        ['unit exponent', cose.COSEKEYS.e, [1]],
        ['even exponent', cose.COSEKEYS.e, [2]],
        ['zero modulus', cose.COSEKEYS.n, [0]],
        ['all-zero padded modulus', cose.COSEKEYS.n, new Uint8Array(257)],
        ['1024-bit modulus', cose.COSEKEYS.n, new Uint8Array(128).fill(255)],
        ['2047-bit modulus', cose.COSEKEYS.n, [127, ...new Uint8Array(255).fill(255)]],
        ['padded 2047-bit modulus', cose.COSEKEYS.n, [0, 127, ...new Uint8Array(255).fill(255)]],
      ] as const
    ) {
      it(`${purpose}: ${label} → refusal, consumed attempt, no authority publication`, async () => {
        using host = fixture(policy(purpose));
        const grant = purpose === 'add' ? await seed(host) : undefined;
        const beginName = purpose === 'create' ? 'account.create.begin' : 'passkey.add.begin';
        const finishName = purpose === 'create' ? 'account.create.finish' : 'passkey.add.finish';
        const begin = value(await host.call(beginName, {}, grant?.credential));
        const input = {
          transaction: begin.transaction,
          response: withParameter(key.registration(begin.options), parameter, bytes),
        };
        expect(await host.call(finishName, input, grant?.credential))
          .to.eql({ kind: 'rejected', code: 'verification-rejected' });
        expect(await host.call(finishName, input, grant?.credential))
          .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
        await proveRefusalRecovery(host, grant, begin.options.user.id);
      });
    }

    it(`${purpose}: leading-zero padding on a 2048-bit modulus → admission and sign-in`, async () => {
      using host = fixture(policy(purpose));
      const grant = purpose === 'add' ? await seed(host) : undefined;
      const beginName = purpose === 'create' ? 'account.create.begin' : 'passkey.add.begin';
      const finishName = purpose === 'create' ? 'account.create.finish' : 'passkey.add.finish';
      const begin = value(await host.call(beginName, {}, grant?.credential));
      const response = key.registration(begin.options);
      const encoded = registrationKey(response);
      const publicKey = isoCBOR.decodeFirst<t.CoseKeyMap>(encoded);
      const modulus = publicKey.get(cose.COSEKEYS.n);
      if (!Is.uint8Array(modulus)) throw new Error('Expected fixture modulus');
      expect(modulus.length).to.equal(256);
      expect(modulus[0] & 128).to.equal(128);
      const result = value<t.Accounts.Grant | t.Accounts.Session>(
        await host.call(finishName, {
          transaction: begin.transaction,
          response: withParameter(response, cose.COSEKEYS.n, [0, 0, ...modulus]),
        }, grant?.credential),
      );
      if (grant) {
        expect(result).to.eql({
          ...grant.session,
          account: { ...grant.session.account, credentialCount: 2 },
        });
      }
      const signIn = value(await host.call('session.signIn.begin', {}));
      value(
        await host.call('session.signIn.finish', {
          transaction: signIn.transaction,
          response: await key.assertion(signIn.options, begin.options.user.id),
        }),
      );
    });

    it(`${purpose}: native 3072-bit RSA → admission and sign-in`, async () => {
      const larger = await authenticator(-257, 3072);
      using host = fixture(policy(purpose));
      const grant = purpose === 'add' ? await seed(host) : undefined;
      const beginName = purpose === 'create' ? 'account.create.begin' : 'passkey.add.begin';
      const finishName = purpose === 'create' ? 'account.create.finish' : 'passkey.add.finish';
      const begin = value(await host.call(beginName, {}, grant?.credential));
      value<t.Accounts.Grant | t.Accounts.Session>(
        await host.call(finishName, {
          transaction: begin.transaction,
          response: larger.registration(begin.options),
        }, grant?.credential),
      );
      const signIn = value(await host.call('session.signIn.begin', {}));
      value(
        await host.call('session.signIn.finish', {
          transaction: signIn.transaction,
          response: await larger.assertion(signIn.options, begin.options.user.id),
        }),
      );
    });

    for (const operation of ['importKey', 'verify'] as const) {
      for (
        const defect of [
          new Error('public key error: UNEXPECTED_NATIVE_FAILURE'),
          new TypeError(malformedKey),
          new DOMException(malformedKey, 'OperationError'),
        ]
      ) {
        it(`${purpose}: RSA ${operation} unexpected ${defect.name} → sanitized failure`, async () => {
          using host = fixture(policy(purpose));
          const grant = purpose === 'add' ? await seed(host) : undefined;
          const beginName = purpose === 'create' ? 'account.create.begin' : 'passkey.add.begin';
          const finishName = purpose === 'create' ? 'account.create.finish' : 'passkey.add.finish';
          const begin = value(await host.call(beginName, {}, grant?.credential));
          const input = {
            transaction: begin.transaction,
            response: key.registration(begin.options),
          };
          let calls = 0;
          const fail = () => {
            calls++;
            throw defect;
          };
          {
            using _mock = WebFixture.Property.mock([{
              target: crypto.subtle,
              key: operation,
              descriptor: { configurable: true, value: fail },
            }]);
            const completion = (await Try.run(() =>
              host.call(finishName, input, grant?.credential)
            )).result;
            expect(calls).to.equal(1);
            expect(completion.ok).to.equal(false);
            if (completion.ok) throw new Error('Expected service failure');
            expect(completion.error.message).to.equal('Account service failed.');
            expect(completion.error.stack).to.equal(undefined);
            expect(completion.error.cause).to.equal(undefined);
          }
          expect(await host.call(finishName, input, grant?.credential))
            .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
          await proveRefusalRecovery(host, grant, begin.options.user.id);
        });
      }
    }
  }
});

function policy(purpose: 'create' | 'add'): t.AccountService.CreateOptions {
  const options = config();
  options.capacity = {
    accounts: 1,
    credentials: purpose === 'create' ? 1 : 2,
    sessions: 2,
    transactions: 1,
  };
  return options;
}

async function seed(host: ReturnType<typeof fixture>): Promise<t.Accounts.Grant> {
  const begin = value(await host.call('account.create.begin', {}));
  return value(
    await host.call('account.create.finish', {
      transaction: begin.transaction,
      response: owner.registration(begin.options),
    }),
  );
}

/** Public follow-ups prove absence of association, capacity leaks, and enrollment session changes. */
async function proveRefusalRecovery(
  host: ReturnType<typeof fixture>,
  grant: t.Accounts.Grant | undefined,
  handle: string,
) {
  const unknown = value(await host.call('session.signIn.begin', {}));
  expect(
    await host.call('session.signIn.finish', {
      transaction: unknown.transaction,
      response: await key.assertion(unknown.options, handle),
    }),
  ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
  if (grant) {
    expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
    const fresh = value(await host.call('passkey.add.begin', {}, grant.credential));
    expect(fresh.options.excludeCredentials?.map((item) => item.id)).to.eql([owner.id]);
    const session = value(
      await host.call('passkey.add.finish', {
        transaction: fresh.transaction,
        response: key.registration(fresh.options),
      }, grant.credential),
    );
    expect(session.account.credentialCount).to.equal(2);
    expect(session.expiresAt).to.equal(grant.session.expiresAt);
    handle = fresh.options.user.id;
  } else {
    const fresh = value(await host.call('account.create.begin', {}));
    value(
      await host.call('account.create.finish', {
        transaction: fresh.transaction,
        response: key.registration(fresh.options),
      }),
    );
    handle = fresh.options.user.id;
  }
  // Same credential can be associated, and the last session slot remains available.
  const signIn = value(await host.call('session.signIn.begin', {}));
  value(
    await host.call('session.signIn.finish', {
      transaction: signIn.transaction,
      response: await key.assertion(signIn.options, handle),
    }),
  );
}

function registrationKey(response: t.Accounts.Wire.Registration): Uint8Array<ArrayBuffer> {
  // Decode the fixture's matching native hint; withParameter rewrites authoritative attestation too.
  const data = isoBase64URL.toBuffer(response.response.authenticatorData);
  const encoded = parseAuthenticatorData(data).credentialPublicKey;
  if (!encoded) throw new Error('Expected fixture public key');
  return encoded;
}

function withParameter(
  response: t.Accounts.Wire.Registration,
  parameter: number,
  bytes: readonly number[] | Uint8Array,
): t.Accounts.Wire.Registration {
  return registrationPublicKey(response, (publicKey) => {
    publicKey.set(parameter, new Uint8Array(bytes));
  });
}
