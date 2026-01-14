import { type t, Fs, Hash, Is, Json, Obj, PlaybackSchema, Slug } from './common.ts';
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
 * - If playback cannot be generated or fails schema validation, records a
 *   dedicated lint issue with the precise reason.
 */
export async function bundleSequenceFilepaths(
  dag: Dag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: {
    facets?: Facet[];
    outDir?: string;
    baseHref?: string;

    /**
     * When true, require this slug to support playback derivation via a
     * playback-related trait (e.g. `{ of: "media-composition", as: "sequence" }`).
     *
     * Default: false — best-effort mode.
     */
    requirePlayback?: boolean;
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
    const issue = await buildSequenceFilepathIssue(docid, args);
    if (issue) {
      issues.push(issue);
      return;
    }

    const { kind, raw, resolvedPath, exists } = args;
    if (!exists || !resolvedPath) return;

    const hash = Hash.sha256((await Fs.read(resolvedPath)).data);
    const ext = Fs.extname(resolvedPath);
    const filename = `${hash}${ext}`;
    const kindDir = kind === 'image' ? dir.image : dir.video;

    const destDir = Fs.join(dir.base, kindDir);
    const destPath = Fs.join(destDir, filename);

    await Fs.ensureDir(destDir);
    if (!(await Fs.exists(destPath))) await Fs.copy(resolvedPath, destPath);

    const stat = await Fs.stat(resolvedPath);
    const bytes = Is.number(stat?.size) ? stat.size : undefined;
    const href = `${baseHref}/${kindDir}/${filename}`;

    assets.push({
      kind,
      logicalPath: String(raw),
      hash,
      filename,
      href,
      stats: { bytes },
    });
  };

  await walkSequenceMediaPaths(dag, yamlPath, docid, facets, visit);

  /**
   * Write asset manifest.
   */
  if (assets.length > 0) {
    const manifest: t.SlugAssetsManifest = { docid, assets };
    const filename = `${dir.manifests}/slug.${docid}.assets.json`;
    await Fs.write(Fs.join(dir.base, filename), Json.stringify(manifest));
  }

  /**
   * Attempt to derive and validate playback manifest.
   */
  const Playback = Slug.Trait.MediaComposition.Playback;
  const playbackResult = await Playback.fromDag(dag, yamlPath, docid, {
    validate: true,
    trait: { of: 'media-composition' },
  });

  const playbackFilename = `slug.${docid}.playback.json`;

  const pushNotExportedError = (path: string, message: string) => {
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
  };

  const yamlPathStr = Is.array(yamlPath) && yamlPath.length > 0 ? yamlPath.join('/') : '';

  if (!playbackResult.ok) {
    const reason = playbackResult.error?.message ?? 'Unknown validation error.';

    const isNotApplicable =
      reason.includes('does not advertise') &&
      reason.includes('expected {of:"media-composition", as:string}');

    const requirePlayback = opts.requirePlayback ?? false;
    if (!isNotApplicable || requirePlayback) {
      pushNotExportedError(
        yamlPathStr,
        `Playback manifest could not be generated from slug sequence. Reason: ${reason}`,
      );
    }
  } else {
    const raw = playbackResult.sequence as Record<string, unknown>;
    const candidate = {
      docid: raw['docid'],
      composition: raw['composition'],
      beats: raw['beats'],
    };
    const parsed = PlaybackSchema.Manifest.parse(candidate);

    if (!parsed.ok) {
      const reason = parsed.errors
        .map((e) => `${e.path.length > 0 ? e.path : '<root>'}: ${e.message}`)
        .join('; ');

      pushNotExportedError(
        yamlPathStr,
        `Playback manifest failed @sys/schema validation. Reason: ${reason}`,
      );
    } else {
      const outPath = Fs.join(dir.base, dir.manifests, playbackFilename);
      await Fs.write(outPath, Json.stringify(parsed.value));
    }
  }

  return Obj.asGetter({ dir, issues }, ['issues']);
}
