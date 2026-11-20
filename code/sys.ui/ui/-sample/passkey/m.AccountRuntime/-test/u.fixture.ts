import { HttpCmd } from '@sys/http/cmd';
import { AccountRuntime } from '../mod.ts';
import { Json, type t, Time, WebFixture } from './common.ts';

export { wallClock } from '../../-test/u.fixture.wallClock.ts';

type Handlers = ReturnType<t.Accounts.Service>;
type EditableHandlers = { -readonly [N in keyof Handlers]: Handlers[N] };
export const endpoint = 'https://accounts.example.test/cmd';
export const token = 'PRIVATE_TEST_BEARER';
export const rpId = 'example.test';
export const policy = { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 };
export const accepted = <V>(value: V) => ({ kind: 'accepted', value } as const);
export const creation = (): t.Accounts.Wire.CreationOptions => ({
  rp: { id: rpId, name: 'Test RP' },
  user: { id: 'user', name: 'sample', displayName: 'Sample' },
  challenge: 'PRIVATE_TEST_CHALLENGE',
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
});
const registration = (): t.Accounts.Wire.Registration => ({
  id: 'key',
  rawId: 'key',
  type: 'public-key',
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'PRIVATE_TEST_CLIENT_DATA',
    attestationObject: 'o',
    authenticatorData: 'a',
    transports: ['internal'],
    publicKeyAlgorithm: -7,
  },
});
const assertion = (): t.Accounts.Wire.Authentication => ({
  id: 'key',
  rawId: 'key',
  type: 'public-key',
  clientExtensionResults: {},
  response: { clientDataJSON: 'c', authenticatorData: 'a', signature: 's', userHandle: 'user' },
});

/** Native-shaped test objects; no credentials API or network is called. */
export function browser() {
  class Attestation {}
  class Assertion {}
  class Credential {
    static parseCreationOptionsFromJSON(value: t.Accounts.Wire.CreationOptions) {
      observations.creation.push(value);
      return { challenge: new Uint8Array([1]) };
    }
    static parseRequestOptionsFromJSON(value: t.Accounts.Wire.RequestOptions) {
      observations.request.push(value);
      return { challenge: new Uint8Array([2]) };
    }
    constructor(readonly response: Attestation | Assertion, readonly json: unknown) {}
    toJSON() {
      return this.json;
    }
  }
  const observations = {
    creation: [] as t.Accounts.Wire.CreationOptions[],
    request: [] as t.Accounts.Wire.RequestOptions[],
    calls: [] as ('create' | 'get')[],
    signals: [] as AbortSignal[],
  };
  const native = {
    create: (_options: CredentialCreationOptions) => Promise.resolve<unknown>(registration()),
    get: (_options: CredentialRequestOptions) => Promise.resolve<unknown>(assertion()),
  };
  const credentials = {
    async create(options: CredentialCreationOptions) {
      observations.calls.push('create');
      if (options.signal) observations.signals.push(options.signal);
      const json = await native.create(options);
      return json === null ? null : new Credential(new Attestation(), json);
    },
    async get(options: CredentialRequestOptions) {
      observations.calls.push('get');
      if (options.signal) observations.signals.push(options.signal);
      const json = await native.get(options);
      return json === null ? null : new Credential(new Assertion(), json);
    },
  };
  const mock = WebFixture.Property.mock([
    property('isSecureContext', true),
    property('navigator', { credentials }),
    property('PublicKeyCredential', Credential),
    property('AuthenticatorAttestationResponse', Attestation),
    property('AuthenticatorAssertionResponse', Assertion),
  ]);
  return { ...observations, native, Credential, [Symbol.dispose]: () => mock.dispose() };
}

export function transport(service?: t.Accounts.Service) {
  const requests: {
    name: string;
    url: string;
    authorization: string | null;
    credentials: RequestCredentials;
    redirect: RequestRedirect;
  }[] = [];
  const session = {
    account: { principal: 'principal', credentialCount: 1 },
    expiresAt: Time.now.timestamp + 60_000,
  };
  const begin = { transaction: 'PRIVATE_TEST_TRANSACTION', expiresAt: session.expiresAt };
  const handlers: EditableHandlers = {
    'account.create.begin': () => accepted({ ...begin, options: creation() }),
    'account.create.finish': () => accepted({ credential: token, session }),
    'session.signIn.begin': () => accepted({ ...begin, options: { rpId, challenge: 'signIn' } }),
    'session.signIn.finish': () => accepted({ credential: token, session }),
    'passkey.add.begin': () => accepted({ ...begin, options: creation() }),
    'passkey.add.finish': () =>
      accepted({ ...session, account: { ...session.account, credentialCount: 2 } }),
    'session.inspect': () => accepted(session),
    'session.revoke': () => accepted(null),
  };
  const faults = { lost: '', invalid: '' };
  let fetchCount = 0;
  const fetcher: t.Fetch = async (input, init) => {
    fetchCount++;
    const req = new Request(input, init);
    const message = Json.parse<{ name: string }>(await req.clone().text());
    if (!message) throw new Error('Expected a command request');
    const { name } = message;
    const authorization = req.headers.get('authorization');
    requests.push({
      name,
      url: req.url,
      authorization,
      credentials: req.credentials,
      redirect: req.redirect,
    });
    const credential = authorization?.slice('Bearer '.length);
    const selected = service?.({ credential }) ?? handlers;
    const result = await HttpCmd.handle(req, {
      policy,
      cmd: { ns: 'accounts', handlers: selected },
    });
    if (name === faults.lost || name === faults.invalid) {
      await result.body?.cancel();
      if (name === faults.lost) throw new Error('PRIVATE_TEST_NETWORK_ERROR');
      return new Response('{"broken":true}');
    }
    return result;
  };
  const mock = WebFixture.Fetch.mock(fetcher);
  const options = { endpoint, namespace: 'accounts', rpId, policy };
  return {
    get fetchCount() {
      return fetchCount;
    },
    requests,
    handlers,
    faults,
    options,
    session,
    create: () => AccountRuntime.create(options),
    [Symbol.dispose]: () => mock.dispose(),
  };
}

function property(key: PropertyKey, value: unknown) {
  return {
    target: globalThis,
    key,
    descriptor: { value, configurable: true, writable: true },
  };
}
