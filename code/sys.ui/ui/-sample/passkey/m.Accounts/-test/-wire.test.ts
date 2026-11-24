import { describe, expect, it } from '../../../-test.ts';
import { Accounts } from '../mod.ts';
import { Num, type t } from '../common.ts';

const session = {
  account: { principal: 'account.test', label: 'Test account', credentialCount: 1 },
  expiresAt: 1_700_000_000_000,
};

const creation: t.Accounts.Wire.CreationOptions = {
  challenge: 'AQID',
  rp: { id: 'localhost', name: 'Test reference' },
  user: { id: 'BAUG', name: 'Test account', displayName: 'Test account' },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
  authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  attestation: 'none',
  extensions: { credProps: true },
  excludeCredentials: [{ id: 'BwgJ', type: 'public-key', transports: ['internal', 'hybrid'] }],
};
const registration: t.Accounts.Wire.Registration = {
  id: 'BwgJ',
  rawId: 'BwgJ',
  type: 'public-key',
  authenticatorAttachment: 'platform',
  clientExtensionResults: { credProps: { rk: true } },
  response: {
    clientDataJSON: 'AQID',
    attestationObject: 'BAUG',
    authenticatorData: 'BwgJ',
    transports: ['internal', 'hybrid'],
    publicKeyAlgorithm: -7,
    publicKey: 'CgsM',
  },
};
const assertion: t.Accounts.Wire.Authentication = {
  id: 'BwgJ',
  rawId: 'BwgJ',
  type: 'public-key',
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'AQID',
    authenticatorData: 'BAUG',
    signature: 'BwgJ',
    userHandle: 'BAUG',
  },
};

/** These are wire-admission tests, not verification or session-authority proof. */
describe('Accounts wire admission', () => {
  it('private grant → admitted only at session-issuing operations', () => {
    const grant = { kind: 'accepted', value: { credential: 'secret.test', session } };
    expect(Accounts.readResult('account.create.finish', grant)).to.equal(grant);
    expect(Accounts.readResult('session.signIn.finish', grant)).to.equal(grant);
    expect(Accounts.readResult('session.inspect', grant)).to.equal(undefined);
    expect(Accounts.readResult('passkey.add.finish', grant)).to.equal(undefined);
  });

  it('secret or malformed account observations → rejected without coercion', () => {
    const invalid = [
      { ...session, credential: 'secret.test' },
      { ...session, account: { ...session.account, label: '' } },
      { ...session, account: { principal: 'account.test', credentialCount: 1 } },
      { ...session, account: { ...session.account, credential: 'secret.test' } },
      ...[-1, 0.5, NaN, Num.INFINITY, Num.MAX_INT + 1, '1'].map((credentialCount) => ({
        ...session,
        account: { ...session.account, credentialCount },
      })),
      ...[-1, 0.5, NaN, Num.INFINITY, Num.MAX_INT + 1, '123'].map((expiresAt) => ({
        ...session,
        expiresAt,
      })),
    ];
    for (const value of invalid) {
      expect(Accounts.readResult('session.inspect', { kind: 'accepted', value })).to.equal(
        undefined,
      );
    }
    for (const value of [0, 1, Num.MAX_INT]) {
      const observed = {
        kind: 'accepted',
        value: { account: { ...session.account, credentialCount: value }, expiresAt: value },
      };
      expect(Accounts.readResult('session.inspect', observed)).to.equal(observed);
    }
  });

  it('begin payload → no account selector, profile, or bearer channel', () => {
    const names = ['account.create.begin', 'session.signIn.begin', 'passkey.add.begin'] as const;
    const invalid = [undefined, null, [], { principal: 'other' }, { credential: 'secret.test' }];
    for (const name of names) {
      const empty = {};
      expect(Accounts.readPayload(name, empty)).to.equal(empty);
      for (const value of invalid) {
        expect(Accounts.readPayload(name, value)).to.equal(undefined);
      }
    }
  });

  it('standard options → native JSON input types without conversion or mutation', () => {
    const result = {
      kind: 'accepted',
      value: { transaction: 'tx.test', expiresAt: 1_700_000_000_000, options: creation },
    };
    for (const name of ['account.create.begin', 'passkey.add.begin'] as const) {
      const read = Accounts.readResult(name, result);
      if (read?.kind !== 'accepted') throw new Error('Expected creation options');
      const native: PublicKeyCredentialCreationOptionsJSON = read.value.options;
      expect(native).to.equal(creation);
      expect(native.excludeCredentials).to.eql(creation.excludeCredentials);
    }
    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: 'AQID',
      rpId: 'localhost',
      userVerification: 'required',
    };
    const read = Accounts.readResult('session.signIn.begin', {
      kind: 'accepted',
      value: { ...result.value, options },
    });
    if (read?.kind !== 'accepted') throw new Error('Expected sign-in options');
    const native: PublicKeyCredentialRequestOptionsJSON = read.value.options;
    expect(native).to.equal(options);

    const invalid = [
      { ...creation, challenge: new Uint8Array([1, 2, 3]) },
      { ...creation, pubKeyCredParams: [] },
      { ...creation, user: { ...creation.user, id: 'not/base64' } },
      { ...creation, extensions: { credProps: 'true' } },
      { ...creation, extensions: { prf: {} } },
      { ...creation, authenticatorSelection: { residentKey: 'sometimes' } },
    ];
    for (const options of invalid) {
      expect(Accounts.readResult('account.create.begin', {
        kind: 'accepted',
        value: { ...result.value, options },
      })).to.equal(undefined);
    }
  });

  it('registration/assertion JSON → operation-specific completion without serialization', () => {
    for (const name of ['account.create.finish', 'passkey.add.finish'] as const) {
      const payload = { transaction: 'tx.test', response: registration };
      expect(Accounts.readPayload(name, payload)).to.equal(payload);
      expect(Accounts.readPayload(name, { ...payload, principal: 'other' })).to.equal(undefined);
      expect(Accounts.readPayload(name, { ...payload, response: assertion })).to.equal(undefined);
      expect(Accounts.readPayload('session.signIn.finish', payload)).to.equal(undefined);
    }
    const payload = { transaction: 'tx.test', response: assertion };
    expect(Accounts.readPayload('session.signIn.finish', payload)).to.equal(payload);
    const invalid = [
      { ...assertion, type: 'password' },
      { ...assertion, rawId: '' },
      { ...assertion, clientExtensionResults: [] },
      { ...assertion, response: { ...assertion.response, signature: null } },
      { ...assertion, response: { ...assertion.response, userHandle: 123 } },
    ];
    for (const response of invalid) {
      expect(Accounts.readPayload('session.signIn.finish', { ...payload, response })).to.equal(
        undefined,
      );
    }
    expect(Accounts.readPayload('session.signIn.finish', { ...payload, transaction: '' })).to.equal(
      undefined,
    );
  });

  it('registration JSON without required response members → rejected', () => {
    for (const name of ['account.create.finish', 'passkey.add.finish'] as const) {
      for (const field of ['authenticatorData', 'transports', 'publicKeyAlgorithm'] as const) {
        const response: Partial<t.Accounts.Wire.Registration['response']> = {
          ...registration.response,
        };
        delete response[field];
        const payload = { transaction: 'tx.test', response: { ...registration, response } };
        expect(Accounts.readPayload(name, payload), `${name}: missing ${field}`).to.equal(
          undefined,
        );
      }
    }
  });

  it('registration JSON with empty transports or omitted publicKey → admitted unchanged', () => {
    const withoutPublicKey = { ...registration.response };
    delete withoutPublicKey.publicKey;
    for (const name of ['account.create.finish', 'passkey.add.finish'] as const) {
      for (const response of [{ ...registration.response, transports: [] }, withoutPublicKey]) {
        const payload = { transaction: 'tx.test', response: { ...registration, response } };
        expect(Accounts.readPayload(name, payload)).to.equal(payload);
      }
    }
  });

  it('registration JSON with null response members → rejected rather than omitted', () => {
    const fields = ['authenticatorData', 'transports', 'publicKeyAlgorithm', 'publicKey'] as const;
    for (const name of ['account.create.finish', 'passkey.add.finish'] as const) {
      for (const field of fields) {
        const response = { ...registration.response, [field]: null };
        const payload = { transaction: 'tx.test', response: { ...registration, response } };
        expect(Accounts.readPayload(name, payload), `${name}: null ${field}`).to.equal(undefined);
      }
    }
  });

  it('inspection/revocation → scoped absence, not grant or renewal', () => {
    const absence = { kind: 'accepted', value: null };
    for (const name of ['session.inspect', 'session.revoke'] as const) {
      expect(Accounts.readResult(name, absence)).to.equal(absence);
      expect(Accounts.readPayload(name, {})).to.eql({});
      expect(Accounts.readPayload(name, { principal: 'other' })).to.equal(undefined);
    }
    expect(Accounts.readResult('session.revoke', { kind: 'accepted', value: session })).to.equal(
      undefined,
    );
    expect(Accounts.readResult('passkey.add.finish', { kind: 'accepted', value: session })).to.eql({
      kind: 'accepted',
      value: session,
    });
  });

  it('unknown/inherited command names → no schema selected', () => {
    for (const name of ['constructor', '__proto__', 'toString', 'account.delete']) {
      // @ts-expect-error Exercise the untyped caller boundary as well as the static command vocabulary.
      expect(Accounts.readPayload(name, {})).to.equal(undefined);
      // @ts-expect-error Unknown names cannot select a service-result schema.
      expect(Accounts.readResult(name, { kind: 'accepted', value: null })).to.equal(undefined);
    }
  });

  it('unrecognized or transport outcomes → not a service rejection', () => {
    const invalid = [
      { kind: 'indeterminate' },
      { kind: 'not-submitted', reason: 'cancelled' },
      { kind: 'rejected', code: 'remote boom secret.test' },
      { kind: 'rejected', code: 'invalid-request', cause: 'secret.test' },
      { kind: 'rejected', code: 'no-session' },
    ];
    for (const value of invalid) {
      expect(Accounts.readResult('account.create.begin', value)).to.equal(undefined);
    }
    const rejection = { kind: 'rejected', code: 'no-session' };
    expect(Accounts.readResult('passkey.add.begin', rejection)).to.equal(rejection);
  });
});
