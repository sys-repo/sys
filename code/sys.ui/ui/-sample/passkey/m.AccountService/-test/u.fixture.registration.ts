import {
  isoBase64URL,
  isoCBOR,
  isoUint8Array,
  parseAuthenticatorData,
} from '@simplewebauthn/server/helpers';
import type { t } from './common.ts';

/** Rewrite the fixture's final COSE key in both attestation bytes and the native JSON hint. */
export function registrationPublicKey(
  response: t.Accounts.Wire.Registration,
  change: (key: t.CoseKeyMap) => void,
): t.Accounts.Wire.Registration {
  return registrationData(response, (data) => {
    const encoded = parseAuthenticatorData(data).credentialPublicKey;
    if (!encoded) throw new Error('Expected fixture public key');
    const key = isoCBOR.decodeFirst<t.CoseKeyMap>(encoded);
    change(key);
    return isoUint8Array.concat([
      data.slice(0, data.length - encoded.length),
      isoCBOR.encode(key),
    ]);
  });
}

/** Rewrite the authoritative attestation bytes and matching native JSON hint together. */
export function registrationData(
  response: t.Accounts.Wire.Registration,
  change: (data: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>,
): t.Accounts.Wire.Registration {
  const attestation = isoCBOR.decodeFirst<t.AttestationMap>(
    isoBase64URL.toBuffer(response.response.attestationObject),
  );
  const data = change(isoBase64URL.toBuffer(response.response.authenticatorData));
  attestation.set('authData', data);
  return {
    ...response,
    response: {
      ...response.response,
      authenticatorData: isoBase64URL.fromBuffer(data),
      attestationObject: isoBase64URL.fromBuffer(isoCBOR.encode(attestation)),
    },
  };
}
