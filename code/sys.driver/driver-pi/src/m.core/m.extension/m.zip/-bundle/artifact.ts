import { Is, type t } from './common.ts';
import { assertPolicyMarker, hashZipArtifact } from './mod.ts';
import artifact from './artifact.json' with { type: 'json' };

const KEYS = ['bundleHash', 'text'];

/** Prep-generated ZIP bundle with validated shape, marker, and byte digest. */
export const zipReadBundle = admitZipArtifact(artifact);

/**
 * Admit the prepared ZIP bundle without unchecked JSON casts.
 */
export function admitZipArtifact(input: unknown, kind: t.Kind = 'read'): t.Artifact {
  if (!Is.record(input) || Is.Native.proxy(input)) {
    throw new Error(`Prepared ZIP ${kind} extension artifact must be a record.`);
  }
  const properties = Object.getOwnPropertyDescriptors(input);
  const keys = Reflect.ownKeys(properties);
  if (
    keys.length !== KEYS.length ||
    keys.some((key) => !Is.string(key) || !KEYS.includes(key)) ||
    !('value' in properties.bundleHash) || !('value' in properties.text)
  ) {
    throw new Error(`Prepared ZIP ${kind} extension artifact has an invalid field set.`);
  }

  const bundleHash: unknown = properties.bundleHash.value;
  const text: unknown = properties.text.value;
  if (
    !Is.string(bundleHash) || !/^sha256-[a-f0-9]{64}$/.test(bundleHash) || !Is.string(text)
  ) {
    throw new Error(`Prepared ZIP ${kind} extension artifact has invalid values.`);
  }
  if (hashZipArtifact(text) !== bundleHash) {
    throw new Error(`Prepared ZIP ${kind} extension digest does not match its bytes.`);
  }
  assertPolicyMarker(text, kind);
  return Object.freeze({ bundleHash, text });
}
