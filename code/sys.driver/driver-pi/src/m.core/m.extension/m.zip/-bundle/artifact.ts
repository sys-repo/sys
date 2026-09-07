import { Is } from './common.ts';
import { assertPolicyMarker, hashZipReadArtifact, type ZipReadBundleArtifact } from './mod.ts';
import artifact from './artifact.json' with { type: 'json' };

const KEYS = ['bundleHash', 'text'];

/** Prep-generated ZIP bundle with validated shape, marker, and byte digest. */
export const zipReadBundle = admitZipReadArtifact(artifact);

/**
 * Admit the prepared ZIP bundle without unchecked JSON casts.
 */
export function admitZipReadArtifact(input: unknown): ZipReadBundleArtifact {
  if (!Is.record(input) || Is.Native.proxy(input)) {
    throw new Error('Prepared ZIP read extension artifact must be a record.');
  }
  const properties = Object.getOwnPropertyDescriptors(input);
  const keys = Reflect.ownKeys(properties);
  if (
    keys.length !== KEYS.length ||
    keys.some((key) => !Is.string(key) || !KEYS.includes(key)) ||
    !('value' in properties.bundleHash) || !('value' in properties.text)
  ) {
    throw new Error('Prepared ZIP read extension artifact has an invalid field set.');
  }

  const bundleHash: unknown = properties.bundleHash.value;
  const text: unknown = properties.text.value;
  if (
    !Is.string(bundleHash) || !/^sha256-[a-f0-9]{64}$/.test(bundleHash) || !Is.string(text)
  ) {
    throw new Error('Prepared ZIP read extension artifact has invalid values.');
  }
  if (hashZipReadArtifact(text) !== bundleHash) {
    throw new Error('Prepared ZIP read extension digest does not match its bytes.');
  }
  assertPolicyMarker(text);
  return Object.freeze({ bundleHash, text });
}
