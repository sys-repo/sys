import { zipReadBundle } from '../-bundle/artifact.ts';
import { assertPolicyMarker, ZIP_POLICY_MARKER } from '../-bundle/mod.ts';
import type { t } from '../common.ts';
import { Json } from '../common.ts';

/**
 * Inject one launch policy into the admitted read-only ZIP artifact.
 */
export function makeArtifact(policy: t.PiZipExtension.Policy) {
  if (!policy.enabled) throw new Error('Cannot materialize a disabled ZIP extension policy.');
  assertPolicyMarker(zipReadBundle.text);

  return zipReadBundle.text.replace(ZIP_POLICY_MARKER, () => Json.stringify(policy));
}
