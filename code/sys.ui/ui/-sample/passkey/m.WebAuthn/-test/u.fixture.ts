import { Obj, type t, WebFixture } from './common.ts';

type Call = {
  readonly method: 'create' | 'get';
  readonly options: CredentialCreationOptions | CredentialRequestOptions | undefined;
  readonly receiver: unknown;
};

/** Identity-bearing stand-ins for browser-native constructors, which cannot be called directly. */
export function browser() {
  class Attestation {
    readonly clientDataJSON = new Uint8Array([1, 2]).buffer;
    readonly attestationObject = new Uint8Array([3, 4]).buffer;
    getTransports = (): AuthenticatorTransport[] => ['internal'];
  }
  class Assertion {
    readonly clientDataJSON = new Uint8Array([1, 2]).buffer;
    readonly authenticatorData = new Uint8Array([5, 6]).buffer;
    readonly signature = new Uint8Array([7, 8]).buffer;
    readonly userHandle = null;
  }
  class PublicKey {
    readonly type = 'public-key';
    readonly id = 'browser-credential';
    readonly rawId = new Uint8Array([9, 10]).buffer;
    constructor(readonly response: Attestation | Assertion) {}
    getClientExtensionResults = (): AuthenticationExtensionsClientOutputs => ({});
  }

  // The test boundary supplies native-shaped objects with the constructors installed below.
  const registration = new PublicKey(new Attestation()) as unknown as t.WebAuthn.Registration;
  const assertion = new PublicKey(new Assertion()) as unknown as t.WebAuthn.Assertion;
  const calls: Call[] = [];
  const credentials: Pick<CredentialsContainer, 'create' | 'get'> = {
    // Native methods require their CredentialsContainer receiver; record it at this interop seam.
    create(this: unknown, options) {
      calls.push({ method: 'create', options, receiver: this });
      return Promise.resolve(registration);
    },
    get(this: unknown, options) {
      calls.push({ method: 'get', options, receiver: this });
      return Promise.resolve(assertion);
    },
  };
  const globals = {
    isSecureContext: true,
    navigator: { credentials },
    PublicKeyCredential: PublicKey,
    AuthenticatorAttestationResponse: Attestation,
    AuthenticatorAssertionResponse: Assertion,
  };
  return { globals, credentials, calls, registration, assertion };
}

/** Install browser globals by descriptor so setup never invokes a test's getter. */
export function installGlobals(values: Record<string, unknown>) {
  const entries = Obj.keys(values).map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(values, key)!;
    return { target: globalThis, key, descriptor: { ...descriptor, configurable: true } };
  });
  return WebFixture.Property.mock(entries);
}

export function createOptions(): t.WebAuthn.CreateOptions {
  return {
    publicKey: {
      rp: { id: 'passkey.example', name: 'Test relying party' },
      user: { id: new Uint8Array([11, 12]), name: 'test-user', displayName: 'Test user' },
      challenge: new Uint8Array([13, 14]),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      attestation: 'none',
      excludeCredentials: [{ type: 'public-key', id: new Uint8Array([15, 16]) }],
    },
    signal: new AbortController().signal,
  };
}

export function getOptions(): t.WebAuthn.GetOptions {
  return {
    publicKey: {
      rpId: 'passkey.example',
      challenge: new Uint8Array([17, 18]),
      userVerification: 'required',
      allowCredentials: [{ type: 'public-key', id: new Uint8Array([19, 20]) }],
    },
    mediation: 'optional',
    signal: new AbortController().signal,
  };
}
