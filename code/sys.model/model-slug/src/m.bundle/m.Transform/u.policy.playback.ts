import { type t } from './common.ts';
import { playbackFromNormalized } from './u.playback.fromNormalized.ts';
import { sequenceFromDag } from './u.policy.sequence.ts';
import { sequenceToTimecode } from './u.sequence.normalize.toTimecode.ts';

export async function playbackFromDag(
  dag: t.SlugBundleTransform.Dag.Shape,
  yamlPath: t.ObjectPath,
  docid: string,
  opts?: { validate?: boolean; trait?: t.SlugTraitGateOptions | null },
): Promise<t.SlugValidateResult<t.SpecTimelineManifest>> {
  const result = await sequenceFromDag(dag, yamlPath, docid, { ...opts });
  if (!result.ok) return { ok: false, error: result.error };
  const normalized = sequenceToTimecode(result.sequence, { docid, yamlPath });
  const sequence = playbackFromNormalized(docid, normalized);
  return { ok: true, sequence };
}
