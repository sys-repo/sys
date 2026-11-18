import { verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import {
  convertCOSEtoPKCS,
  cose,
  decodeAttestationObject,
  decodeClientDataJSON,
  decodeCredentialPublicKey,
  isoBase64URL,
  isoCBOR,
  parseAuthenticatorData,
  verifySignature,
} from '@simplewebauthn/server/helpers';
import { Curves, Is, type t } from './common.ts';

const { COSEALG, COSECRV, COSEKEYS, COSEKTY } = cose;

/**
 * Reference allow-list of WebAuthn's registered COSE algorithm identifiers:
 * - -7: ES256 — ECDSA with P-256 and SHA-256.
 * - -8: EdDSA — Ed25519.
 * - -257: RS256 — RSA PKCS#1 v1.5 with SHA-256.
 * Hosts may choose a subset; other identifiers are rejected at construction.
 */
export const algorithms = [COSEALG.ES256, COSEALG.EdDSA, COSEALG.RS256] as const;

/** Library boundary; only affirmative verification releases credential metadata to the service. */
export const verifier: t.Verifier = {
  async registration(response, challenge, policy) {
    if (!clientData(response.response.clientDataJSON)) return undefined;
    if (!noneAttestation(response.response.attestationObject, policy)) return undefined;
    // Upstream exceptions propagate to the service's sanitized failure boundary. Never infer
    // input or defect provenance from messages emitted across the full verifier.
    const result = await verifyRegistrationResponse({
      // Native JSON permits future attachment strings; the verifier does not use this hint.
      response: { ...response, authenticatorAttachment: undefined },
      expectedChallenge: challenge,
      expectedOrigin: [...policy.origins],
      expectedRPID: policy.rp.id,
      requireUserPresence: true,
      requireUserVerification: true,
      supportedAlgorithmIDs: [...policy.algorithms],
    });
    if (!result.verified) return undefined;
    const info = result.registrationInfo;
    if (info.credential.id !== response.id || !info.userVerified) return undefined;
    if (!await usableKey(info.credential.publicKey)) return undefined;
    return {
      credential: info.credential,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
    };
  },

  async authentication(response, challenge, stored, policy) {
    if (!clientData(response.response.clientDataJSON)) return undefined;
    const bytes = isoBase64URL.toBuffer(response.response.authenticatorData);
    if (!authenticatorData(bytes)) return undefined;
    const result = await verifyAuthenticationResponse({
      response: { ...response, authenticatorAttachment: undefined },
      expectedChallenge: challenge,
      expectedOrigin: [...policy.origins],
      expectedRPID: policy.rp.id,
      requireUserVerification: true,
      credential: { ...stored.credential, publicKey: stored.credential.publicKey.slice() },
    });
    if (!result.verified) return undefined;
    const info = result.authenticationInfo;
    if (!info.userVerified || info.credentialDeviceType !== stored.deviceType) return undefined;
    return {
      counter: info.newCounter,
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp,
    };
  },
};

/**
 * Helpers:
 */

/** Admit client-data shape and disallow cross-origin ceremonies; upstream owns binding checks. */
function clientData(encoded: string): boolean {
  let data: unknown;
  try {
    data = decodeClientDataJSON(encoded);
  } catch (error) {
    // JSON syntax is an input failure only at this decoding call, not across verification.
    if (Is.error(error) && error.constructor === SyntaxError) return false;
    throw error;
  }
  if (!Is.record(data)) return false;
  if (!Is.str(data.type)) return false;
  if (!Is.str(data.challenge)) return false;
  if (!Is.str(data.origin)) return false;
  if (data.crossOrigin !== undefined && data.crossOrigin !== false) return false;
  if (data.topOrigin !== undefined) return false;

  const binding = data.tokenBinding;
  if (binding === undefined) return true;
  if (!Is.record(binding)) return false;
  if (!Is.str(binding.status)) return false;
  return ['present', 'supported', 'not-supported', 'notSupported'].includes(binding.status);
}
function noneAttestation(encoded: string, policy: t.Policy): boolean {
  let data: ReturnType<typeof decodeAttestationObject>;
  try {
    data = decodeAttestationObject(isoBase64URL.toBuffer(encoded));
  } catch (error) {
    if (decoderRejection(error)) return false;
    throw error;
  }
  if (!Is.func(data?.get)) return false;
  if (data.get('fmt') !== 'none') return false;
  if (!Is.uint8Array(data.get('authData'))) return false;
  if (!Is.func(data.get('attStmt')?.get)) return false;
  const parsed = authenticatorData(data.get('authData'));
  if (!parsed?.credentialPublicKey) return false;
  let key: unknown;
  try {
    key = decodeCredentialPublicKey(parsed.credentialPublicKey);
  } catch (error) {
    if (decoderRejection(error)) return false;
    throw error;
  }
  if (!Is.record(key) || !Is.func(key.get)) return false;
  const alg = key.get(COSEKEYS.alg);
  if (!policy.algorithms.some((value) => value === alg)) return false;
  // The label alone is insufficient: signature verification dispatches by key type/curve.
  if (alg === COSEALG.RS256) {
    const n = key.get(COSEKEYS.n);
    const e = key.get(COSEKEYS.e);
    if (key.get(COSEKEYS.kty) !== COSEKTY.RSA) return false;
    if (!Is.uint8Array(n)) return false;
    if (!Is.uint8Array(e)) return false;
    if (e.length === 0) return false;
    // At least 2048 effective bits: ignore zero padding, then inspect the first significant octet.
    const offset = n.findIndex((octet) => octet !== 0);
    if (offset === -1) return false;
    const octets = n.length - offset;
    if (octets > 256) return true;
    if (octets < 256) return false;
    return n[offset] >= 128;
  }
  const x = key.get(COSEKEYS.x);
  const y = key.get(COSEKEYS.y);
  // Both reference curves encode each coordinate as 32 octets.
  if (!Is.uint8Array(x) || x.length !== 32) return false;
  if (alg === COSEALG.EdDSA) {
    if (key.get(COSEKEYS.kty) !== COSEKTY.OKP) return false;
    if (key.get(COSEKEYS.crv) !== COSECRV.ED25519) return false;
    return Curves.Ed25519.isValidPublicKey(x);
  }
  if (alg !== COSEALG.ES256) return false;
  if (key.get(COSEKEYS.kty) !== COSEKTY.EC2) return false;
  if (key.get(COSEKEYS.crv) !== COSECRV.P256) return false;
  if (!Is.uint8Array(y)) return false;
  return y.length === 32;
}

/** Upstream decoding only; nested CBOR, lengths, and impossible backup flags are input failures. */
function authenticatorData(bytes: Uint8Array<ArrayBuffer>) {
  let data: ReturnType<typeof parseAuthenticatorData>;
  try {
    data = parseAuthenticatorData(bytes);
  } catch (error) {
    if (decoderRejection(error)) return undefined;
    if (!Is.error(error)) throw error;
    if (error.constructor === Error) {
      if (/^Authenticator data was \d+ bytes, expected at least 37 bytes$/.test(error.message)) {
        return undefined;
      }
      if (error.message === 'Leftover bytes detected while parsing authenticator data') {
        return undefined;
      }
    }
    // Pinned Deno 2.9.8 converter signals: non-iterable container or non-iterable array entry.
    if (error.constructor === TypeError) {
      if (error.message === 'input is not iterable') return undefined;
      if (error.message === '.for is not iterable') return undefined;
    }
    throw error;
  }
  if (!data.flags.be && data.flags.bs) return undefined;
  if (data.extensionsDataBuffer) {
    // Upstream already decoded/re-encoded these bytes. Inspect shape before its map conversion
    // can make an empty array or an array of pairs indistinguishable from a genuine CBOR map.
    const extensions: unknown = isoCBOR.decodeFirst(data.extensionsDataBuffer);
    if (!(extensions instanceof Map)) return undefined;
    for (const key of extensions.keys()) {
      if (!Is.str(key)) return undefined;
    }
  }
  return data;
}

/** Exercise native key decoding before admission; neither possession nor authenticator trust. */
async function usableKey(encoded: Uint8Array<ArrayBuffer>): Promise<boolean> {
  const key = decodeCredentialPublicKey(encoded);
  if (key.get(COSEKEYS.alg) === COSEALG.RS256) {
    // Algorithm/key-type/byte-shape agreement was established before upstream verification.
    const modulus = (key as cose.COSEPublicKeyRSA).get(COSEKEYS.n)!;
    try {
      // Deno accepts unusable RSA parameters at import/export; verification decodes them.
      // Fixed non-ceremony bytes: the boolean is irrelevant, only successful key decoding matters.
      await verifySignature({
        credentialPublicKey: encoded,
        signature: new Uint8Array(modulus.length),
        data: new Uint8Array([0]),
      });
      return true;
    } catch (error) {
      // Pinned Deno 2.9.8 RSA decoder signal, not arbitrary verification/import failures.
      if (
        Is.error(error) && error.constructor === Error &&
        error.message === 'public key error: SPKI cryptographic key data malformed'
      ) return false;
      throw error;
    }
  }
  if (key.get(COSEKEYS.alg) !== COSEALG.ES256) return true;
  const raw = convertCOSEtoPKCS(encoded);
  try {
    const imported = await crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify'],
    );
    // Import alone is insufficient on Deno: export exercises native EC point decoding.
    await crypto.subtle.exportKey('spki', imported);
    return true;
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
    if (error.name === 'DataError') return false;
    const invalidPoint = error.name === 'OperationError' &&
      error.message === 'expected valid public EC key';
    if (invalidPoint) return false;
    throw error;
  }
}

/** Pinned tiny-cbor 0.2.11 / native bounds failures, confined to decoding calls. */
function decoderRejection(error: unknown): boolean {
  if (!Is.error(error)) return false;
  if (error.constructor === RangeError) {
    return error.message === 'Offset is outside the bounds of the DataView';
  }
  if (error.constructor !== Error) return false;
  return [
    /^(No data|Length not supported or not well formed|Map is not supported or well formed|array is not supported or well formed|Float16 data is unsupported)$/,
    /^CBOR stream ended before (?:tag value|end of Float (?:16|32|64))$/,
    /^Unsupported or not well formed at \d+$/,
  ].some((pattern) => pattern.test(error.message));
}
