import { Num, Schema, type t } from './common.ts';

const { Type: T } = Schema;
const text = T.String({ minLength: 1 });
const encoded = T.String({ pattern: '^[A-Za-z0-9_-]+$' });
const integer = T.Integer({ minimum: 0, maximum: Num.MAX_INT });
const empty = object({});
const account = object({ principal: text, credentialCount: integer });
const session = object({ account, expiresAt: integer });
const grant = object({ credential: text, session });
const verification = T.Union([
  T.Literal('required'),
  T.Literal('preferred'),
  T.Literal('discouraged'),
]);
const descriptor = object({
  type: T.Literal('public-key'),
  id: encoded,
  transports: T.Optional(T.Array(text)),
});
const extensions = T.Optional(object({ credProps: T.Optional(T.Boolean()) }));
const sharedOptions = {
  challenge: encoded,
  timeout: T.Optional(integer),
  hints: T.Optional(T.Array(text)),
  extensions,
};
const creation = object({
  ...sharedOptions,
  rp: object({ id: T.Optional(text), name: text }),
  user: object({ id: encoded, name: T.String(), displayName: T.String() }),
  pubKeyCredParams: T.Array(object({ type: T.Literal('public-key'), alg: T.Integer() }), {
    minItems: 1,
  }),
  excludeCredentials: T.Optional(T.Array(descriptor)),
  attestation: T.Optional(T.String()),
  authenticatorSelection: T.Optional(object({
    authenticatorAttachment: T.Optional(
      T.Union([T.Literal('platform'), T.Literal('cross-platform')]),
    ),
    requireResidentKey: T.Optional(T.Boolean()),
    residentKey: T.Optional(verification),
    userVerification: T.Optional(verification),
  })),
});
const authentication = object({
  ...sharedOptions,
  rpId: T.Optional(text),
  allowCredentials: T.Optional(T.Array(descriptor)),
  userVerification: T.Optional(T.String()),
});
const credential = {
  id: encoded,
  rawId: encoded,
  type: T.Literal('public-key'),
  authenticatorAttachment: T.Optional(T.String()),
  // Parsed JSON extension data stays opaque: neither authority nor an observation.
  clientExtensionResults: T.Record(T.String(), T.Unknown()),
};
const registration = object({
  ...credential,
  response: object({
    clientDataJSON: encoded,
    attestationObject: encoded,
    authenticatorData: encoded,
    transports: T.Array(text),
    publicKeyAlgorithm: T.Integer(),
    publicKey: T.Optional(encoded),
  }),
});
const assertion = object({
  ...credential,
  response: object({
    clientDataJSON: encoded,
    authenticatorData: encoded,
    signature: encoded,
    userHandle: T.Optional(encoded),
  }),
});
const finishCodes = ['invalid-transaction', 'verification-rejected', 'state-changed', 'capacity'];

/** Private schemas for the fixed unary command payloads. */
export const payloads = {
  'account.create.begin': empty,
  'account.create.finish': finish(registration),
  'session.signIn.begin': empty,
  'session.signIn.finish': finish(assertion),
  'passkey.add.begin': empty,
  'passkey.add.finish': finish(registration),
  'session.inspect': empty,
  'session.revoke': empty,
} satisfies Record<t.Accounts.Name, t.TSchema>;

/** Private schemas for service replies; client dispatch uncertainty is deliberately absent. */
export const results = {
  'account.create.begin': reply(challenge(creation), ['capacity']),
  'account.create.finish': reply(grant, [...finishCodes, 'credential-conflict']),
  'session.signIn.begin': reply(challenge(authentication), ['capacity']),
  'session.signIn.finish': reply(grant, finishCodes),
  'passkey.add.begin': reply(challenge(creation), ['no-session', 'capacity']),
  'passkey.add.finish': reply(session, [...finishCodes, 'no-session', 'credential-conflict']),
  'session.inspect': reply(T.Union([session, T.Null()]), []),
  'session.revoke': reply(T.Null(), []),
} satisfies Record<t.Accounts.Name, t.TSchema>;

/**
 * Helpers:
 */
function object<const P extends Record<string, t.TSchema>>(properties: P) {
  return T.Object(properties, { additionalProperties: false });
}
function finish(response: t.TSchema) {
  return object({ transaction: text, response });
}
function challenge(options: t.TSchema) {
  return object({ transaction: text, expiresAt: integer, options });
}
function reply(value: t.TSchema, codes: readonly string[]) {
  return T.Union([
    object({ kind: T.Literal('accepted'), value }),
    object({
      kind: T.Literal('rejected'),
      code: T.Union(['invalid-request', ...codes].map((code) => T.Literal(code))),
    }),
  ]);
}
