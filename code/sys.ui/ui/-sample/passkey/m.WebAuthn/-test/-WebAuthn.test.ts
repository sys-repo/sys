import { beforeAll, describe, expect, expectTypeOf, it, type t, Try } from './common.ts';
import { browser, createOptions, getOptions, installGlobals } from './u.fixture.ts';

describe('WebAuthn browser mechanism', () => {
  let WebAuthn: t.WebAuthn.Lib;

  beforeAll(async () => {
    // Any browser access during the first module import fails the suite, regardless of test order.
    function unexpectedAccess(): never {
      throw new Error('Browser access during import');
    }
    using _globals = installGlobals({
      get navigator() {
        return unexpectedAccess();
      },
      get isSecureContext() {
        return unexpectedAccess();
      },
      get PublicKeyCredential() {
        return unexpectedAccess();
      },
      get AuthenticatorAttestationResponse() {
        return unexpectedAccess();
      },
      get AuthenticatorAssertionResponse() {
        return unexpectedAccess();
      },
    });
    WebAuthn = (await import('../mod.ts')).WebAuthn;
  });

  it('entry → same mechanism, with native option/result contracts', async () => {
    const implementation = await import('../m.WebAuthn.ts');
    expect(WebAuthn).to.equal(implementation.WebAuthn);
    expectTypeOf(WebAuthn.create).toEqualTypeOf<
      (options: t.WebAuthn.CreateOptions) => Promise<t.WebAuthn.Registration | null>
    >();
    expectTypeOf(WebAuthn.get).toEqualTypeOf<
      (options: t.WebAuthn.GetOptions) => Promise<t.WebAuthn.Assertion | null>
    >();
    expectTypeOf(createOptions().publicKey).toEqualTypeOf<PublicKeyCredentialCreationOptions>();
    expectTypeOf(getOptions().publicKey).toEqualTypeOf<PublicKeyCredentialRequestOptions>();
  });

  it('available → secure API exposure only, with no ceremony', () => {
    const b = browser();
    using _globals = installGlobals(b.globals);
    expect(WebAuthn.availability()).to.eql({ kind: 'available' });
    expect(b.calls).to.eql([]);
  });

  it('availability → current environment, not an import-time snapshot', () => {
    const b = browser();
    {
      using _globals = installGlobals({ ...b.globals, isSecureContext: false });
      expect(WebAuthn.availability()).to.eql({ kind: 'unavailable', reason: 'insecure-context' });
    }
    {
      using _globals = installGlobals(b.globals);
      expect(WebAuthn.availability()).to.eql({ kind: 'available' });
    }
    expect(b.calls).to.eql([]);
  });

  const unsupported = [
    { name: 'navigator', missing: { navigator: undefined } },
    { name: 'credentials', missing: { navigator: {} } },
    {
      name: 'create method',
      missing: { navigator: { credentials: { get: () => Promise.resolve(null) } } },
    },
    {
      name: 'get method',
      missing: { navigator: { credentials: { create: () => Promise.resolve(null) } } },
    },
    { name: 'credential constructor', missing: { PublicKeyCredential: undefined } },
    { name: 'attestation constructor', missing: { AuthenticatorAttestationResponse: undefined } },
    { name: 'assertion constructor', missing: { AuthenticatorAssertionResponse: undefined } },
    { name: 'secure-context knowledge', missing: { isSecureContext: undefined } },
  ];
  for (const { name, missing } of unsupported) {
    it(`missing ${name} → unsupported without IO`, async () => {
      const b = browser();
      using _globals = installGlobals({ ...b.globals, ...missing });
      expect(WebAuthn.availability()).to.eql({ kind: 'unavailable', reason: 'unsupported' });
      const creation = (await Try.run(() => WebAuthn.create(createOptions()))).result;
      const acquisition = (await Try.run(() => WebAuthn.get(getOptions()))).result;
      for (const result of [creation, acquisition]) {
        expect(result.ok).to.eql(false);
        if (result.ok) throw new Error('Expected unsupported ceremony to reject');
        expect(result.error.name).to.eql('NotSupportedError');
      }
      expect(b.calls).to.eql([]);
    });
  }

  it('insecure context → rejects both ceremonies without invoking credentials', async () => {
    const b = browser();
    using _globals = installGlobals({ ...b.globals, isSecureContext: false });
    const creation = (await Try.run(() => WebAuthn.create(createOptions()))).result;
    const acquisition = (await Try.run(() => WebAuthn.get(getOptions()))).result;
    for (const result of [creation, acquisition]) {
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('Expected insecure ceremony to reject');
      expect(result.error.name).to.eql('NotSupportedError');
    }
    expect(b.calls).to.eql([]);
  });

  it('create → preserves the complete native options, receiver, and registration object', async () => {
    const b = browser();
    using _globals = installGlobals(b.globals);
    const options = Object.freeze(createOptions());
    const before = structuredClone(options.publicKey);
    const result = await WebAuthn.create(options);
    expect(result).to.equal(b.registration);
    expect(b.calls.length).to.eql(1);
    expect(b.calls[0].method).to.eql('create');
    expect(b.calls[0].options).to.equal(options);
    expect(b.calls[0].receiver).to.equal(b.credentials);
    expect(options.publicKey).to.eql(before);
    expect(result?.response.getTransports()).to.eql(['internal']);
  });

  it('get → preserves the complete native options, receiver, and assertion object', async () => {
    const b = browser();
    using _globals = installGlobals(b.globals);
    const options = Object.freeze(getOptions());
    const before = structuredClone(options.publicKey);
    const result = await WebAuthn.get(options);
    expect(result).to.equal(b.assertion);
    expect(b.calls.length).to.eql(1);
    expect(b.calls[0].method).to.eql('get');
    expect(b.calls[0].options).to.equal(options);
    expect(b.calls[0].receiver).to.equal(b.credentials);
    expect(options.publicKey).to.eql(before);
    expect(result?.response.signature).to.equal(b.assertion.response.signature);
  });

  it('browser null → remains null for both ceremonies', async () => {
    const b = browser();
    b.credentials.create = () => Promise.resolve(null);
    b.credentials.get = () => Promise.resolve(null);
    using _globals = installGlobals(b.globals);
    expect(await WebAuthn.create(createOptions())).to.eql(null);
    expect(await WebAuthn.get(getOptions())).to.eql(null);
  });

  it('wrong credential or response kind → TypeError, never a typed ceremony result', async () => {
    const b = browser();
    using _globals = installGlobals(b.globals);
    const unexpected = [
      { type: 'password', id: 'other' },
      { type: 'public-key', id: 'forged' },
    ];
    for (const credential of unexpected) {
      b.credentials.create = () => Promise.resolve(credential);
      b.credentials.get = () => Promise.resolve(credential);
      const creation = (await Try.run(() => WebAuthn.create(createOptions()))).result;
      const acquisition = (await Try.run(() => WebAuthn.get(getOptions()))).result;
      for (const result of [creation, acquisition]) {
        expect(result.ok).to.eql(false);
        if (result.ok) throw new Error('Expected wrong credential to reject');
        expect(result.error.name).to.eql('TypeError');
      }
    }
    b.credentials.create = () => Promise.resolve(b.assertion);
    b.credentials.get = () => Promise.resolve(b.registration);
    const creation = (await Try.run(() => WebAuthn.create(createOptions()))).result;
    const acquisition = (await Try.run(() => WebAuthn.get(getOptions()))).result;
    for (const result of [creation, acquisition]) {
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('Expected wrong response kind to reject');
      expect(result.error.name).to.eql('TypeError');
    }
  });

  for (const name of ['AbortError', 'NotAllowedError', 'SecurityError']) {
    it(`${name} → preserves the platform exception without diagnosis`, async () => {
      const b = browser();
      const error = new DOMException('Browser supplied detail', name);
      b.credentials.create = () => Promise.reject(error);
      b.credentials.get = () => {
        throw error;
      };
      using _globals = installGlobals(b.globals);
      const creation = (await Try.run(() => WebAuthn.create(createOptions()))).result;
      const acquisition = (await Try.run(() => WebAuthn.get(getOptions()))).result;
      for (const result of [creation, acquisition]) {
        expect(result.ok).to.eql(false);
        if (result.ok) throw new Error('Expected platform failure to reject');
        expect(result.error).to.equal(error);
      }
    });
  }

  it('caller abort → native signal forwarding, including an already-aborted signal', async () => {
    const b = browser();
    const abort = new AbortController();
    const error = new DOMException('Caller stopped this operation', 'AbortError');
    let forwarded: AbortSignal | undefined;
    b.credentials.create = (options) => {
      forwarded = options?.signal;
      return new Promise((_resolve, reject) => {
        forwarded?.addEventListener('abort', () => reject(forwarded?.reason), { once: true });
      });
    };
    b.credentials.get = (options) => {
      options?.signal?.throwIfAborted();
      return Promise.resolve(b.assertion);
    };
    using _globals = installGlobals(b.globals);
    const creating = WebAuthn.create({ ...createOptions(), signal: abort.signal });
    expect(forwarded).to.equal(abort.signal);
    abort.abort(error);
    const creation = (await Try.run(() => creating)).result;
    const options = { ...getOptions(), signal: abort.signal };
    const acquisition = (await Try.run(() => WebAuthn.get(options))).result;
    for (const result of [creation, acquisition]) {
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('Expected browser cancellation to reject');
      expect(result.error).to.equal(error);
    }
  });
});
