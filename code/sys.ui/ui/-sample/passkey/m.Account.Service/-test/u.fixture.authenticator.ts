import { cose, isoBase64URL, isoCBOR, isoUint8Array } from '@simplewebauthn/server/helpers';
import { Hash, Json, Random, type t } from './common.ts';

const { COSEKEYS, COSEKTY, COSECRV } = cose;

/** Synthetic protocol fixture: native WebCrypto signs assertions; upstream CBOR encodes test data. */
export async function authenticator(
  alg: t.AuthenticatorAlgorithm = -257,
  rsaBits = 2048,
): Promise<t.Authenticator> {
  const keys = await generateKeys(alg, rsaBits);
  const jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
  const publicKey = publicKeyBytes(alg, jwk);
  const id = Random.base36(40);
  const rawId = isoBase64URL.toBuffer(id);

  function data(type: string, challenge: string, changes: t.CeremonyOverrides) {
    return isoBase64URL.fromUTF8String(Json.stringify({
      type,
      challenge: changes.challenge ?? challenge,
      origin: changes.origin ?? 'https://accounts.example.test',
      crossOrigin: false,
      ...changes.clientData,
    }, 0));
  }
  function authData(rpId: string, registration: boolean, changes: t.CeremonyOverrides) {
    const hash = isoUint8Array.fromHex(Hash.sha256(changes.rpId ?? rpId, { prefix: false }));
    const count = new Uint8Array(4);
    new DataView(count.buffer).setUint32(0, changes.counter ?? 0);
    const flags = changes.flags ??
      (1 | (changes.userVerified === false ? 0 : 4) | (registration ? 64 : 0));
    const base = [hash, new Uint8Array([flags]), count];
    if (registration) {
      const length = new Uint8Array(2);
      new DataView(length.buffer).setUint16(0, rawId.length);
      base.push(new Uint8Array(16), length, rawId, publicKey);
    }
    if (changes.extensions) base.push(new Uint8Array(changes.extensions));
    return isoUint8Array.concat(base);
  }
  return {
    id,
    registration(options, changes = {}) {
      const bytes = authData(options.rp.id!, true, changes);
      const attestation: t.AttestationMap = new Map();
      attestation.set('fmt', 'none');
      attestation.set('attStmt', new Map<string, never>());
      attestation.set('authData', bytes);
      return {
        id,
        rawId: id,
        type: 'public-key',
        clientExtensionResults: { credProps: { rk: true } },
        response: {
          clientDataJSON: data('webauthn.create', options.challenge, changes),
          attestationObject: isoBase64URL.fromBuffer(isoCBOR.encode(attestation)),
          authenticatorData: isoBase64URL.fromBuffer(bytes),
          transports: ['internal'],
          publicKeyAlgorithm: alg,
        },
      };
    },
    async assertion(options, handle, changes = {}) {
      const bytes = authData(options.rpId!, false, changes);
      const clientDataJSON = data('webauthn.get', options.challenge, changes);
      const hash = isoUint8Array.fromHex(
        Hash.sha256(isoBase64URL.toBuffer(clientDataJSON), { prefix: false }),
      );
      let signature = new Uint8Array(
        await crypto.subtle.sign(
          signatureAlgorithm(alg),
          keys.privateKey,
          isoUint8Array.concat([bytes, hash]),
        ),
      );
      if (changes.badSignature) signature[0] ^= 1;
      if (alg === -7) signature = derSignature(signature);
      return {
        id,
        rawId: id,
        type: 'public-key',
        clientExtensionResults: {},
        response: {
          clientDataJSON,
          authenticatorData: isoBase64URL.fromBuffer(bytes),
          signature: isoBase64URL.fromBuffer(signature),
          userHandle: handle,
        },
      };
    },
  };
}

/**
 * Helpers:
 */
async function generateKeys(
  alg: t.AuthenticatorAlgorithm,
  rsaBits: number,
): Promise<CryptoKeyPair> {
  switch (alg) {
    case -7:
      return await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify'],
      );
    case -8:
      return await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
    case -257:
      return await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: rsaBits,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
      );
  }
}

function publicKeyBytes(alg: t.AuthenticatorAlgorithm, jwk: JsonWebKey): Uint8Array<ArrayBuffer> {
  const key: t.CoseKeyMap = new Map([[COSEKEYS.alg, alg]]);
  switch (alg) {
    case -7:
      key.set(COSEKEYS.kty, COSEKTY.EC2);
      key.set(COSEKEYS.crv, COSECRV.P256);
      key.set(COSEKEYS.x, isoBase64URL.toBuffer(jwk.x!));
      key.set(COSEKEYS.y, isoBase64URL.toBuffer(jwk.y!));
      break;
    case -8:
      key.set(COSEKEYS.kty, COSEKTY.OKP);
      key.set(COSEKEYS.crv, COSECRV.ED25519);
      key.set(COSEKEYS.x, isoBase64URL.toBuffer(jwk.x!));
      break;
    case -257:
      key.set(COSEKEYS.kty, COSEKTY.RSA);
      key.set(COSEKEYS.n, isoBase64URL.toBuffer(jwk.n!));
      key.set(COSEKEYS.e, isoBase64URL.toBuffer(jwk.e!));
      break;
  }
  return isoCBOR.encode(key);
}

function signatureAlgorithm(alg: t.AuthenticatorAlgorithm): AlgorithmIdentifier | EcdsaParams {
  switch (alg) {
    case -7:
      return { name: 'ECDSA', hash: 'SHA-256' };
    case -8:
      return 'Ed25519';
    case -257:
      return 'RSASSA-PKCS1-v1_5';
  }
}

/** Test-only ES256 envelope: WebCrypto's raw r/s → WebAuthn's DER signature, not a signer/verifier. */
function derSignature(raw: Uint8Array): Uint8Array<ArrayBuffer> {
  const integers = [raw.slice(0, 32), raw.slice(32)].map((bytes) => {
    let start = 0;
    while (start < bytes.length - 1 && bytes[start] === 0) start++;
    const value = [...bytes.slice(start)];
    if (value[0] & 128) value.unshift(0);
    return new Uint8Array([2, value.length, ...value]);
  });
  const body = isoUint8Array.concat(integers);
  return new Uint8Array([48, body.length, ...body]);
}
