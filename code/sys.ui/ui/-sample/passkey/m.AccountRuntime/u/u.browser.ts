import { WebAuthn } from '../../m.WebAuthn/mod.ts';
import { Is, Obj, type t } from '../common.ts';

/** Native Level 3 conversion is a separate prerequisite from navigator.credentials. */
export function availability(): t.WebAuthn.Availability {
  const native = WebAuthn.availability();
  if (native.kind === 'unavailable') return native;
  const api = globalThis.PublicKeyCredential;
  if (
    !Is.func(api.parseCreationOptionsFromJSON) || !Is.func(api.parseRequestOptionsFromJSON) ||
    !Is.func(api.prototype.toJSON)
  ) return { kind: 'unavailable', reason: 'unsupported' };
  return native;
}

export async function register(options: t.Accounts.Wire.CreationOptions, signal: AbortSignal) {
  const publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(options);
  if (signal.aborted) return null;
  return await WebAuthn.create({ publicKey, signal });
}

export async function getAssertion(options: t.Accounts.Wire.RequestOptions, signal: AbortSignal) {
  const publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(options);
  if (signal.aborted) return null;
  return await WebAuthn.get({ publicKey, signal });
}

/** Some assertion serializers omit empty extension outputs. Confirm emptiness on the credential. */
export function assertionJson(credential: PublicKeyCredential): unknown {
  const json: unknown = credential.toJSON();
  if (!Is.record(json) || Obj.hasOwn(json, 'clientExtensionResults')) return json;
  if (!Is.emptyRecord(credential.getClientExtensionResults())) return json;
  return { ...json, clientExtensionResults: {} };
}
