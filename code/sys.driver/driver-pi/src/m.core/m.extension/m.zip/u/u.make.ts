import { zipReadBundle } from '../-bundle/artifact.ts';
import { zipExtractBundle } from '../-bundle/artifact.extract.ts';
import {
  assertPolicyMarker,
  ZIP_EXTRACT_POLICY_MARKER,
  ZIP_POLICY_MARKER,
} from '../-bundle/mod.ts';
import type { t } from '../common.ts';
import { Json } from '../common.ts';

/**
 * Inject one launch policy literally into the selected admitted ZIP artifact.
 */
export function makeArtifact(policy: t.PiZipExtension.Policy, kind: 'read' | 'extract' = 'read') {
  if (!policy.enabled) throw new Error('Cannot materialize a disabled ZIP extension policy.');
  if (kind === 'extract' && policy.extract !== 'cooperative') {
    throw new Error('Cannot materialize ZIP extraction without cooperative opt-in.');
  }
  const artifact = kind === 'read' ? zipReadBundle : zipExtractBundle;
  const marker = kind === 'read' ? ZIP_POLICY_MARKER : ZIP_EXTRACT_POLICY_MARKER;
  assertPolicyMarker(artifact.text, kind);
  return artifact.text.replace(marker, () => Json.stringify(policy));
}
