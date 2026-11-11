import { Is, type t } from './common.ts';

type Browser = {
  readonly kind: 'available';
  readonly credentials: CredentialsContainer;
  readonly Credential: typeof PublicKeyCredential;
  readonly Attestation: typeof AuthenticatorAttestationResponse;
  readonly Assertion: typeof AuthenticatorAssertionResponse;
};
type Context = Browser | Extract<t.WebAuthn.Availability, { kind: 'unavailable' }>;

/**
 * Native public-key ceremonies. Options and raw results stay caller-owned; no authentication is inferred.
 * Browser access is invocation-local. Platform exceptions propagate unchanged, including ambiguous
 * NotAllowedError outcomes. Cancellation is forwarded, not upgraded to rollback or stale-result control.
 */
export const WebAuthn: t.WebAuthn.Lib = {
  /**
   * Inspect secure-context/API exposure without opening a ceremony.
   */
  availability() {
    const ctx = context();
    return ctx.kind === 'available' ? { kind: 'available' } : ctx;
  },

  /**
   * Forward native creation options and return the original attestation credential or null.
   */
  async create(options) {
    const ctx = browser();
    const credential = await ctx.credentials.create(options);
    if (credential === null) return null;
    if (
      !(credential instanceof ctx.Credential) ||
      !(credential.response instanceof ctx.Attestation)
    ) {
      throw new TypeError('Expected a public-key credential with an attestation response.');
    }
    // Native constructor checks establish this response refinement without copying the browser object.
    return credential as t.WebAuthn.Registration;
  },

  /**
   * Forward native acquisition options and return the original assertion credential or null.
   */
  async get(options) {
    const ctx = browser();
    const credential = await ctx.credentials.get(options);
    if (credential === null) return null;
    if (
      !(credential instanceof ctx.Credential) ||
      !(credential.response instanceof ctx.Assertion)
    ) {
      throw new TypeError('Expected a public-key credential with an assertion response.');
    }
    return credential as t.WebAuthn.Assertion;
  },
};

/**
 * Helpers:
 */
function context(): Context {
  const secure = globalThis.isSecureContext;
  if (secure === false) return { kind: 'unavailable', reason: 'insecure-context' };

  const credentials = globalThis.navigator?.credentials;
  const Credential = globalThis.PublicKeyCredential;
  const Attestation = globalThis.AuthenticatorAttestationResponse;
  const Assertion = globalThis.AuthenticatorAssertionResponse;
  if (
    secure !== true ||
    !credentials ||
    !Is.func(credentials.create) ||
    !Is.func(credentials.get) ||
    !Is.func(Credential) ||
    !Is.func(Attestation) ||
    !Is.func(Assertion)
  ) {
    return { kind: 'unavailable', reason: 'unsupported' };
  }
  return { kind: 'available', credentials, Credential, Attestation, Assertion };
}

function browser(): Browser {
  const ctx = context();
  if (ctx.kind === 'available') return ctx;
  const message = ctx.reason === 'insecure-context'
    ? 'WebAuthn requires a secure context.'
    : 'The browser WebAuthn API is unavailable.';
  throw new DOMException(message, 'NotSupportedError');
}
