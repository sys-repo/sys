import { type t, Is, SlugSchema } from './common.ts';
import { isDagLike } from '../u.dag.ts';
import { deriveAssets } from './u.policy.assets.ts';
import { deriveMeta } from './u.policy.meta.ts';
import { playbackFromDag } from './u.policy.playback.ts';
import { slugTreeFromDag } from './u.policy.tree.ts';

export async function deriveBundle(args: t.SlugBundleTransform.DeriveArgs): Promise<t.SlugBundleTransform.DeriveResult> {
  const base = deriveMeta(args);
  const issues = [...base.issues] as t.SlugBundleTransform.Issue[];
  const manifests: { assets?: t.SlugAssetsManifest; playback?: t.SpecTimelineManifest; tree?: t.SlugTreeDoc } =
    { ...base.manifests };
  const yamlPathStr = Is.array(args.yamlPath) && args.yamlPath.length > 0 ? args.yamlPath.join('/') : '';
  const rawDocid = String(args.docid) as t.StringId;

  if (!isDagLike(args.dag)) return { ok: true, value: { ...base, issues, manifests } };
  const dag = args.dag as t.SlugBundleTransform.Dag.Shape;

  const assetsResult = await deriveAssets({ derive: args, base });
  issues.push(...assetsResult.issues);
  if (assetsResult.manifest) manifests.assets = assetsResult.manifest;

  const playbackResult = await playbackFromDag(dag, args.yamlPath, rawDocid, {
    validate: true,
    trait: { of: 'media-composition' },
  });

  if (!playbackResult.ok) {
    const reason = playbackResult.error?.message ?? 'Unknown validation error.';
    const isNotApplicable =
      reason.includes('does not advertise') && reason.includes('expected {of:"media-composition", as:string}');
    const requirePlayback = args.requirePlayback ?? false;
    if (!isNotApplicable || requirePlayback) {
      issues.push({
        kind: 'sequence:playback:not-exported',
        severity: 'error',
        path: yamlPathStr,
        raw: base.files.playback.raw,
        resolvedPath: '',
        doc: { id: rawDocid },
        message: `Playback manifest could not be generated from slug sequence. Reason: ${reason}`,
      });
    }
  } else {
    const raw = playbackResult.sequence as Record<string, unknown>;
    const candidate = { docid: raw['docid'], composition: raw['composition'], beats: raw['beats'] };
    const res = SlugSchema.Manifest.Validate.playback(candidate);
    if (!res.ok) {
      issues.push({
        kind: 'sequence:playback:not-exported',
        severity: 'error',
        path: yamlPathStr,
        raw: base.files.playback.raw,
        resolvedPath: '',
        doc: { id: rawDocid },
        message: `Playback manifest failed @sys/schema validation. Reason: ${res.error.message}`,
      });
    } else {
      manifests.playback = res.sequence;
    }
  }

  const treeResult = await slugTreeFromDag(dag, args.yamlPath, rawDocid, {
    validate: true,
    trait: { of: 'slug-tree' },
  });
  if (!treeResult.ok) {
    const reason = treeResult.error?.message ?? 'Unknown validation error.';
    const isNotApplicable =
      reason.includes('does not advertise required trait') && reason.includes('of:"slug-tree"');
    if (!isNotApplicable) {
      issues.push({
        kind: 'sequence:slug-tree:not-exported',
        severity: 'error',
        path: yamlPathStr,
        raw: base.files.tree.raw,
        resolvedPath: '',
        doc: { id: rawDocid },
        message: `Slug-tree manifest could not be generated. Reason: ${reason}`,
      });
    }
  } else {
    manifests.tree = treeResult.sequence;
  }

  return { ok: true, value: { ...base, issues, manifests } };
}
