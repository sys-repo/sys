import { type t, Fs, Hash, Is, Json, Obj, Slug } from './common.ts';
import { buildSequenceFilepathIssue } from './u.lint.seq.files.ts';
import { walkSequenceMediaPaths } from './u.lint.seq.files.walk.ts';

type R = t.LintAndBundleResult;
type Dag = t.Graph.Dag.Result;
type Facet = t.DocLintFacet;

/**
 * Bundle all media file paths for a given document:
 * - Uses the shared media-path walker (video + image).
 * - Reuses `buildSequenceFilepathIssue` for *all* lint behaviour.
 * - When there is no issue for a path, hashes + copies the file into a flat
 *   output dir and records it in `slug.<docid>.assets.json`.
 *
 * Additionally:
 * - Always attempts to emit `slug.<docid>.playback.json` (normalized
 *   composition + beats) derived from the slug sequence.
 * - If playback cannot be generated, records a dedicated lint issue so the
 *   caller sees the precise reason alongside file-path problems.
 */
export async function bundleSequenceFilepaths(
  dag: Dag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: {
    facets?: Facet[];
    outDir?: string;
    baseHref?: string;
  } = {},
): Promise<R> {
  const issues: t.LintSequenceFilepath[] = [];
  const assets: t.SlugAsset[] = [];

  const facets: Facet[] = (opts.facets ?? []).filter((v) => v.startsWith('sequence:file:'));
  const baseHref = (opts.baseHref ?? '/').replace(/\/+$/, '');

  const dir: R['dir'] = {
    base: opts.outDir ?? Fs.join(Fs.cwd('terminal'), 'publish.assets'),
    manifests: 'manifests',
    video: 'video',
    image: 'image',
  };

  const visit = async (args: t.LintMediaWalkArgs) => {
    // First, reuse existing lint behaviour.
    const issue = await buildSequenceFilepathIssue(docid, args);
    if (issue) {
      issues.push(issue);
      return; // Do not bundle problematic paths.
    }

    const { kind, raw, resolvedPath, exists } = args;

    // Guardrail: buildSequenceFilepathIssue returns undefined only when we
    // have a concrete, existing path.
    if (!exists || !resolvedPath) return;

    const hash = Hash.sha256((await Fs.read(resolvedPath)).data);
    const ext = Fs.extname(resolvedPath);
    const filename = `${hash}${ext}`;
    const kindDir = kind === 'image' ? dir.image : dir.video;

    const destDir = Fs.join(dir.base, kindDir);
    const destPath = Fs.join(destDir, filename);

    await Fs.ensureDir(destDir);

    // Idempotent copy: skip if already present.
    const destExists = await Fs.exists(destPath);
    if (!destExists) await Fs.copy(resolvedPath, destPath);

    const href = `${baseHref}/${kindDir}/${filename}`;
    assets.push({ kind, logicalPath: String(raw), hash, filename, href });
  };

  await walkSequenceMediaPaths(dag, yamlPath, docid, facets, visit);

  /**
   * Write asset manifest file (json).
   */
  if (assets.length > 0) {
    const manifest: t.SlugAssetsManifest = { docid, assets };
    const filename = `${dir.manifests}/slug.${docid}.assets.json`;
    await Fs.write(Fs.join(dir.base, filename), Json.stringify(manifest));
  }

  /**
   * Always attempt to write playback manifest (composition + beats) as
   * `slug.<docid>.playback.json`, derived from the slug sequence.
   *
   * If playback cannot be generated, record this as a lint issue with the
   * *actual* upstream validation error so the caller gets concrete feedback.
   */
  const Playback = Slug.Trait.MediaComposition.Playback;
  const playbackResult = await Playback.fromDag(dag, yamlPath, docid, { validate: true });
  const playbackFilename = `slug.${docid}.playback.json`;

  if (!playbackResult.ok) {
    const reason = playbackResult.error?.message ?? 'Unknown validation error.';
    const message = `Playback manifest could not be generated from slug sequence. Reason: ${reason}`;
    const path = Is.array(yamlPath) && yamlPath.length > 0 ? yamlPath.join('/') : '';

    const issue: t.LintSequenceFilepath = {
      kind: 'sequence:playback:not-exported',
      severity: 'error',
      path,
      raw: playbackFilename,
      resolvedPath: '',
      doc: { id: docid },
      message,
    };

    issues.push(issue);
  } else {
    const path = Fs.join(dir.base, dir.manifests, playbackFilename);
    await Fs.write(path, Json.stringify(playbackResult.sequence));
  }

  // Finish up.
  return Obj.asGetter({ dir, issues }, ['issues']);
}
