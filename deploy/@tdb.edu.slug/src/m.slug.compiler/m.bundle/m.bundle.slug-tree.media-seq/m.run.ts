import { type t, Fs, FsCapability, Slug, SlugBundle } from './common.ts';
import { makeAssetResolver, makeDurationProbe, makeMediaDurationProbe } from './u.adapter.ts';
import { materializeTransformAssets, writeTransformManifests } from './u.materialize.ts';
import { toBundleSequenceResult } from './u.result.ts';
import { type BundleSeqOpts, resolveRuntimeTargetDefaults } from './u.target.ts';

/**
 * Compiler media-seq bundler path (runtime adapter/materializer).
 * Uses `SlugBundle.Transform` for pure derivation and performs runtime materialization here.
 */
export async function bundleSequenceFilepaths(
  dag: t.BundleSequenceDag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: BundleSeqOpts = {},
): Promise<t.BundleSequenceResult> {
  const fs = FsCapability.fromFs(Fs);
  const targetRuntime = resolveRuntimeTargetDefaults(opts, fs);
  const resolvedSources = new Map<string, string>();
  const parse = Slug.parser(yamlPath);
  const pathCtx = parse.path(dag, docid);

  const assetResolver = makeAssetResolver({ fs, pathCtx, resolvedSources });
  const probeMediaDuration = makeMediaDurationProbe();
  const durationProbe = makeDurationProbe(probeMediaDuration);

  const derive = await SlugBundle.Transform.derive({
    dag,
    yamlPath,
    docid,
    target: targetRuntime.target,
    requirePlayback: opts.requirePlayback,
    facets: opts.facets,
    assetResolver,
    durationProbe,
  });
  if (!derive.ok) throw derive.error;

  const derived = derive.value;

  await materializeTransformAssets({
    fs,
    hints: derived.materialize?.assets,
    sources: resolvedSources,
  });

  await writeTransformManifests({
    fs,
    files: derived.files,
    manifests: derived.manifests,
  });

  return toBundleSequenceResult({
    dir: {
      base: targetRuntime.manifestsBase,
      manifests: targetRuntime.manifestsDir,
      video: targetRuntime.videoDir,
      image: targetRuntime.imageDir,
    },
    issues: derived.issues,
  });
}
