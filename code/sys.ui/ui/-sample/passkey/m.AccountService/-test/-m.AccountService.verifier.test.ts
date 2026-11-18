import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { beforeAll, describe, expect, it, type t, Try, WebFixture } from './common.ts';
import { authenticator, config, fixture, registrationData, value } from './u.fixture.ts';

type RegistrationCase = {
  label: string;
  changes?: t.CeremonyOverrides;
  changeData?: (data: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;
};
type AssertionCase = {
  label: string;
  changes?: t.CeremonyOverrides;
  signature?: readonly number[];
};

let key: t.Authenticator;
let esKey: t.Authenticator;

describe('AccountService verifier boundary', () => {
  beforeAll(async () => {
    key = await authenticator();
    esKey = await authenticator(-7);
  });

  const registrations: readonly RegistrationCase[] = [
    { label: 'truncated nested CBOR', changeData: (data) => data.slice(0, -1) },
    {
      label: 'null extension map',
      changes: { flags: 0xc5 },
      changeData: (data) => new Uint8Array([...data, 0xf6]),
    },
    { label: 'missing attested data', changeData: (data) => data.slice(0, 37) },
    { label: 'impossible backup flags', changes: { flags: 0x55 } },
    { label: 'non-object token binding', changes: { clientData: { tokenBinding: 'bad' } } },
    { label: 'unknown token status', changes: { clientData: { tokenBinding: { status: 'bad' } } } },
  ];
  for (const { label, changes, changeData } of registrations) {
    it(`registration ${label} → refusal, consumed attempt, no authority publication`, async () => {
      const key = esKey;
      const options = config();
      options.algorithms = [-7];
      options.capacity = { accounts: 1, credentials: 1, sessions: 1, transactions: 1 };
      using host = fixture(options);
      const begin = value(await host.call('account.create.begin', {}));
      const native = key.registration(begin.options, changes);
      const response = changeData ? registrationData(native, changeData) : native;
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
      // The same credential and every bounded authority slot remain available.
      const fresh = value(await host.call('account.create.begin', {}));
      value(
        await host.call('account.create.finish', {
          transaction: fresh.transaction,
          response: key.registration(fresh.options),
        }),
      );
    });
  }

  const assertions: readonly AssertionCase[] = [
    { label: 'DER single zero octet', signature: [0] },
    { label: 'DER empty sequence', signature: [48, 0] },
    { label: 'DER reserved length octet', signature: [48, 255] },
    { label: 'DER truncated long-form length', signature: [48, 129] },
    { label: 'DER truncated sequence body', signature: [48, 5] },
    { label: 'DER reserved universal tag 15', signature: [15, 0] },
    { label: 'DER reserved universal tag 37', signature: [37, 0] },
    {
      label: 'DER oversized r component',
      signature: [48, 39, 2, 34, ...new Uint8Array(34).fill(1), 2, 1, 1],
    },
    { label: 'missing attested data', changes: { flags: 0x45 } },
    { label: 'impossible backup flags', changes: { flags: 0x15 } },
    { label: 'non-object token binding', changes: { clientData: { tokenBinding: 'bad' } } },
    { label: 'unknown token status', changes: { clientData: { tokenBinding: { status: 'bad' } } } },
    { label: 'top origin', changes: { clientData: { topOrigin: 'https://other.test' } } },
  ];
  for (const { label, changes, signature } of assertions) {
    it(`assertion ${label} → no admission, consumed attempt, unchanged counter/session`, async () => {
      const key = esKey;
      const options = config();
      options.algorithms = [-7];
      options.capacity.sessions = 2;
      using host = fixture(options);
      const begin = value(await host.call('account.create.begin', {}));
      const grant = value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      const attempt = value(await host.call('session.signIn.begin', {}));
      const response = await key.assertion(attempt.options, begin.options.user.id, {
        counter: 1,
        ...changes,
      });
      const input = {
        transaction: attempt.transaction,
        response: signature === undefined ? response : {
          ...response,
          response: {
            ...response.response,
            signature: isoBase64URL.fromBuffer(new Uint8Array(signature)),
          },
        },
      };
      if (signature) {
        await expectFailure(() => host.call('session.signIn.finish', input));
      } else {
        expect(await host.call('session.signIn.finish', input))
          .to.eql({ kind: 'rejected', code: 'verification-rejected' });
      }
      expect(await host.call('session.signIn.finish', input))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
      expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
      // The same counter and last session slot remain available after either non-admission outcome.
      const fresh = value(await host.call('session.signIn.begin', {}));
      value(
        await host.call('session.signIn.finish', {
          transaction: fresh.transaction,
          response: await key.assertion(fresh.options, begin.options.user.id, { counter: 1 }),
        }),
      );
    });
  }

  for (
    const defect of [
      new Error('SECRET_CRYPTO_DEFECT'),
      new RangeError('SECRET_RANGE_DEFECT'),
      new TypeError('SECRET_TYPE_DEFECT'),
      new SyntaxError('SECRET_SYNTAX_DEFECT'),
    ]
  ) {
    it(`unexpected WebCrypto ${defect.constructor.name} through adapter → sanitized failure`, async () => {
      const key = esKey;
      const options = config();
      options.algorithms = [-7];
      using host = fixture(options);
      const begin = value(await host.call('account.create.begin', {}));
      value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      const attempt = value(await host.call('session.signIn.begin', {}));
      const input = {
        transaction: attempt.transaction,
        response: await key.assertion(attempt.options, begin.options.user.id, { counter: 1 }),
      };
      const descriptor = Object.getOwnPropertyDescriptor(crypto.subtle, 'verify');
      let calls = 0;
      const fail = () => {
        calls++;
        throw defect;
      };
      {
        using _mock = WebFixture.Property.mock([{
          target: crypto.subtle,
          key: 'verify',
          descriptor: { configurable: true, value: fail },
        }]);
        const completion = (await Try.run(() => host.call('session.signIn.finish', input))).result;
        expect(calls).to.equal(1);
        expect(completion.ok).to.equal(false);
        if (completion.ok) throw new Error('Expected service failure');
        expect(completion.error.message).to.equal('Account service failed.');
        expect(completion.error.stack).to.equal(undefined);
        expect(completion.error.cause).to.equal(undefined);
      }
      expect(Object.getOwnPropertyDescriptor(crypto.subtle, 'verify')).to.eql(descriptor);
      expect(await host.call('session.signIn.finish', input))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
      const fresh = value(await host.call('session.signIn.begin', {}));
      value(
        await host.call('session.signIn.finish', {
          transaction: fresh.transaction,
          response: await key.assertion(fresh.options, begin.options.user.id, { counter: 1 }),
        }),
      );
    });
  }

  for (const alg of [-7, -8, -257] as const) {
    for (
      const defect of [
        new Error('Zero buffer length'),
        new Error('Unexpected authentication response challenge "fault"'),
        new TypeError('input is not iterable'),
        new TypeError('.for is not iterable'),
      ]
    ) {
      it(`${alg} native verify fault ${defect.message} → failure, consumed attempt, recovery`, async () => {
        const key = await authenticator(alg);
        const options = config();
        options.algorithms = [alg];
        options.capacity.sessions = 2;
        using host = fixture(options);
        const begin = value(await host.call('account.create.begin', {}));
        const grant = value(
          await host.call('account.create.finish', {
            transaction: begin.transaction,
            response: key.registration(begin.options),
          }),
        );
        const attempt = value(await host.call('session.signIn.begin', {}));
        const input = {
          transaction: attempt.transaction,
          response: await key.assertion(attempt.options, begin.options.user.id, { counter: 1 }),
        };
        let calls = 0;
        {
          using _mock = WebFixture.Property.mock([{
            target: crypto.subtle,
            key: 'verify',
            descriptor: {
              configurable: true,
              value: () => {
                calls++;
                throw defect;
              },
            },
          }]);
          const completion = (await Try.run(() =>
            host.call('session.signIn.finish', input)
          )).result;
          expect(calls).to.equal(1);
          expect(completion.ok).to.equal(false);
          if (completion.ok) throw new Error('Expected service failure');
          expect(completion.error.message).to.equal('Account service failed.');
          expect(completion.error.stack).to.equal(undefined);
          expect(completion.error.cause).to.equal(undefined);
        }
        expect(await host.call('session.signIn.finish', input))
          .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
        expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(
          grant.session,
        );
        const fresh = value(await host.call('session.signIn.begin', {}));
        value(
          await host.call('session.signIn.finish', {
            transaction: fresh.transaction,
            response: await key.assertion(fresh.options, begin.options.user.id, { counter: 1 }),
          }),
        );
      });
    }
  }

  const extensions = [
    { label: 'null container', bytes: [0xf6] },
    { label: 'integer container', bytes: [0x01] },
    { label: 'empty array container', bytes: [0x80] },
    { label: 'array scalar entry', bytes: [0x81, 0x01] },
    { label: 'array null entry', bytes: [0x81, 0xf6] },
    { label: 'array pair entry', bytes: [0x81, 0x82, 0x61, 0x78, 0xf5] },
    { label: 'numeric extension identifier', bytes: [0xa1, 0x01, 0xf5] },
  ];
  for (const { label, bytes } of extensions) {
    for (const purpose of ['create', 'add', 'signIn'] as const) {
      it(`${purpose} extension ${label} → refusal, consumed attempt, public recovery`, async () => {
        const options = config();
        options.capacity = { accounts: 1, credentials: 2, sessions: 2, transactions: 1 };
        using host = fixture(options);
        const begin = value(await host.call('account.create.begin', {}));
        if (purpose === 'create') {
          const input = {
            transaction: begin.transaction,
            response: key.registration(begin.options, { flags: 0xc5, extensions: bytes }),
          };
          expect(await host.call('account.create.finish', input))
            .to.eql({ kind: 'rejected', code: 'verification-rejected' });
          expect(await host.call('account.create.finish', input))
            .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
          const fresh = value(await host.call('account.create.begin', {}));
          value(
            await host.call('account.create.finish', {
              transaction: fresh.transaction,
              response: key.registration(fresh.options),
            }),
          );
          return;
        }
        const grant = value(
          await host.call('account.create.finish', {
            transaction: begin.transaction,
            response: key.registration(begin.options),
          }),
        );
        if (purpose === 'add') {
          const enrolled = await authenticator();
          const attempt = value(await host.call('passkey.add.begin', {}, grant.credential));
          const input = {
            transaction: attempt.transaction,
            response: enrolled.registration(attempt.options, { flags: 0xc5, extensions: bytes }),
          };
          expect(await host.call('passkey.add.finish', input, grant.credential))
            .to.eql({ kind: 'rejected', code: 'verification-rejected' });
          expect(await host.call('passkey.add.finish', input, grant.credential))
            .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
          expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(
            grant.session,
          );
          const fresh = value(await host.call('passkey.add.begin', {}, grant.credential));
          const session = value(
            await host.call('passkey.add.finish', {
              transaction: fresh.transaction,
              response: enrolled.registration(fresh.options),
            }, grant.credential),
          );
          expect(session.account.credentialCount).to.equal(2);
          const login = value(await host.call('session.signIn.begin', {}));
          value(
            await host.call('session.signIn.finish', {
              transaction: login.transaction,
              response: await enrolled.assertion(login.options, fresh.options.user.id),
            }),
          );
          return;
        }
        const attempt = value(await host.call('session.signIn.begin', {}));
        const input = {
          transaction: attempt.transaction,
          response: await key.assertion(attempt.options, begin.options.user.id, {
            counter: 1,
            flags: 0x85,
            extensions: bytes,
          }),
        };
        expect(await host.call('session.signIn.finish', input))
          .to.eql({ kind: 'rejected', code: 'verification-rejected' });
        expect(await host.call('session.signIn.finish', input))
          .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
        expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(
          grant.session,
        );
        const fresh = value(await host.call('session.signIn.begin', {}));
        value(
          await host.call('session.signIn.finish', {
            transaction: fresh.transaction,
            response: await key.assertion(fresh.options, begin.options.user.id, { counter: 1 }),
          }),
        );
      });
    }
  }

  it('valid extension maps → create, enroll and native-signed sign-in; corrupt proof still refused', async () => {
    const options = config();
    options.algorithms = [-257, -7];
    using host = fixture(options);
    // { x: { y: true } }: retain valid nested extension values rather than banning extensions.
    const extensions = [0xa1, 0x61, 0x78, 0xa1, 0x61, 0x79, 0xf5];
    const begin = value(await host.call('account.create.begin', {}));
    const grant = value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: key.registration(begin.options, { flags: 0xc5, extensions }),
      }),
    );
    const add = value(await host.call('passkey.add.begin', {}, grant.credential));
    value(
      await host.call('passkey.add.finish', {
        transaction: add.transaction,
        response: esKey.registration(add.options, { flags: 0xc5, extensions }),
      }, grant.credential),
    );
    const bad = value(await host.call('session.signIn.begin', {}));
    expect(
      await host.call('session.signIn.finish', {
        transaction: bad.transaction,
        response: await esKey.assertion(bad.options, add.options.user.id, {
          flags: 0x85,
          extensions,
          counter: 1,
          badSignature: true,
        }),
      }),
    ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
    const fresh = value(await host.call('session.signIn.begin', {}));
    value(
      await host.call('session.signIn.finish', {
        transaction: fresh.transaction,
        response: await esKey.assertion(fresh.options, add.options.user.id, {
          flags: 0x85,
          extensions,
          counter: 1,
        }),
      }),
    );
  });

  for (const operation of ['importKey', 'exportKey'] as const) {
    for (
      const defect of [
        new TypeError('SECRET_KEY_DEFECT'),
        new DOMException('SECRET_KEY_DEFECT', 'OperationError'),
      ]
    ) {
      it(`EC ${operation} unexpected ${defect.name} → failure, no key/session publication`, async () => {
        const options = config();
        options.algorithms = [-7];
        options.capacity = { accounts: 1, credentials: 1, sessions: 1, transactions: 1 };
        using host = fixture(options);
        const begin = value(await host.call('account.create.begin', {}));
        const input = {
          transaction: begin.transaction,
          response: esKey.registration(begin.options),
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
            host.call('account.create.finish', input)
          )).result;
          expect(calls).to.equal(1);
          expect(completion.ok).to.equal(false);
          if (completion.ok) throw new Error('Expected service failure');
          expect(completion.error.message).to.equal('Account service failed.');
          expect(completion.error.stack).to.equal(undefined);
          expect(completion.error.cause).to.equal(undefined);
        }
        expect(await host.call('account.create.finish', input))
          .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
        const fresh = value(await host.call('account.create.begin', {}));
        value(
          await host.call('account.create.finish', {
            transaction: fresh.transaction,
            response: esKey.registration(fresh.options),
          }),
        );
      });
    }
  }

  for (
    const { boundary, target, key: property } of [
      { boundary: 'JSON', target: JSON, key: 'parse' },
      { boundary: 'CBOR', target: DataView.prototype, key: 'getUint8' },
      { boundary: 'authenticator data', target: DataView.prototype, key: 'getUint16' },
    ]
  ) {
    for (
      const defect of [
        new Error('SECRET_DECODE'),
        new RangeError('SECRET_DECODE'),
        new TypeError('SECRET_DECODE'),
      ]
    ) {
      it(`${boundary} unexpected ${defect.constructor.name} → sanitized failure, no publication`, async () => {
        const options = config();
        options.capacity = { accounts: 1, credentials: 1, sessions: 1, transactions: 1 };
        using host = fixture(options);
        const begin = value(await host.call('account.create.begin', {}));
        const input = { transaction: begin.transaction, response: key.registration(begin.options) };
        let calls = 0;
        const fail = () => {
          calls++;
          throw defect;
        };
        {
          using _mock = WebFixture.Property.mock([{
            target,
            key: property,
            descriptor: { configurable: true, value: fail },
          }]);
          const completion = (await Try.run(() =>
            host.call('account.create.finish', input)
          )).result;
          expect(calls).to.equal(1);
          expect(completion.ok).to.equal(false);
          if (completion.ok) throw new Error('Expected service failure');
          expect(completion.error.message).to.equal('Account service failed.');
          expect(completion.error.stack).to.equal(undefined);
          expect(completion.error.cause).to.equal(undefined);
        }
        expect(await host.call('account.create.finish', input))
          .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
        const fresh = value(await host.call('account.create.begin', {}));
        value(
          await host.call('account.create.finish', {
            transaction: fresh.transaction,
            response: key.registration(fresh.options),
          }),
        );
      });
    }
  }

  it('recognized malformed CBOR and client data → verification refusal', async () => {
    using host = fixture();
    for (
      const malformed of [
        { attestationObject: 'AA' },
        { attestationObject: 'oQ' },
        { clientDataJSON: 'bnVsbA' },
        { clientDataJSON: 'A' },
      ]
    ) {
      const begin = value(await host.call('account.create.begin', {}));
      const response = key.registration(begin.options);
      Object.assign(response.response, malformed);
      expect(await host.call('account.create.finish', { transaction: begin.transaction, response }))
        .to.eql({ kind: 'rejected', code: 'verification-rejected' });
    }
  });

  it('signed assertion with wrong challenge, origin, RP, or UV → sanitized failure, no publication', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: key.registration(begin.options),
      }),
    );
    for (
      const changes of [
        { origin: 'https://other.test' },
        { rpId: 'other.test' },
        { challenge: 'different' },
        { userVerified: false },
      ]
    ) {
      const attempt = value(await host.call('session.signIn.begin', {}));
      const input = {
        transaction: attempt.transaction,
        response: await key.assertion(attempt.options, begin.options.user.id, changes),
      };
      await expectFailure(() => host.call('session.signIn.finish', input));
      expect(await host.call('session.signIn.finish', input))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    }
    const fresh = value(await host.call('session.signIn.begin', {}));
    value(
      await host.call('session.signIn.finish', {
        transaction: fresh.transaction,
        response: await key.assertion(fresh.options, begin.options.user.id),
      }),
    );
  });

  it('recognized malformed assertions → refusal without cryptographic metadata', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: key.registration(begin.options),
      }),
    );
    for (
      const malformed of [
        { authenticatorData: 'AA' },
        { signature: 'A' },
        { clientDataJSON: 'bnVsbA' },
      ]
    ) {
      const attempt = value(await host.call('session.signIn.begin', {}));
      const response = await key.assertion(attempt.options, begin.options.user.id);
      Object.assign(response.response, malformed);
      expect(
        await host.call('session.signIn.finish', { transaction: attempt.transaction, response }),
      )
        .to.eql({ kind: 'rejected', code: 'verification-rejected' });
    }
  });
});

/** Upstream exceptions are failures, not an inferred diagnosis of input or defect provenance. */
async function expectFailure(run: () => Promise<unknown>) {
  const { result } = await Try.run(run);
  expect(result.ok).to.equal(false);
  if (result.ok) throw new Error('Expected service failure');
  expect(result.error.message).to.equal('Account service failed.');
  expect(result.error.stack).to.equal(undefined);
  expect(result.error.cause).to.equal(undefined);
}
