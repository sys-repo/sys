import { type t, Ffmpeg, Fs, Hash, Is, Json, Obj, Slug } from './common.ts';
import { buildSequenceFilepathIssue } from '../m.lint/u.lint.seq.files.ts';
import { walkSequenceMediaPaths } from '../m.lint/u.lint.seq.files.walk.ts';

type R = t.LintAndBundleResult;
type Dag = t.Graph.Dag.Result;
type Facet = t.SlugLintFacet;

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
    target?: t.LintMediaSeqBundle['target'];

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
  const facets: Facet[] = (opts.facets ?? []).filter((v) => v.startsWith('media:seq:file:'));
  const baseHref = (opts.target?.hrefBase ?? opts.baseHref ?? '/').replace(/\/+$/, '');

  const yamlPathStr = Is.array(yamlPath) && yamlPath.length > 0 ? yamlPath.join('/') : '';

  const baseDir = opts.target?.base ?? opts.outDir ?? Fs.join(Fs.cwd('terminal'), 'publish.assets');
  const manifestsDir = opts.target?.manifests?.dir ?? 'manifests';
  const videoDir = opts.target?.media?.video ?? 'video';
  const imageDir = opts.target?.media?.image ?? 'image';

  const assetsTemplate = opts.target?.manifests?.assets ?? 'slug.<docid>.assets.json';
  const playbackTemplate = opts.target?.manifests?.playback ?? 'slug.<docid>.playback.json';
  const treeTemplate = opts.target?.manifests?.tree ?? 'slug-tree.<docid>.json';

  const dir: R['dir'] = {
    base: baseDir,
    manifests: manifestsDir,
    video: videoDir,
    image: imageDir,
  };

  const assetsFilename = resolveTemplate(assetsTemplate, docid);
  const playbackFilename = resolveTemplate(playbackTemplate, docid);
  const slugTreeFilename = resolveTemplate(treeTemplate, docid);

  const assetsPath = resolvePath(baseDir, manifestsDir, assetsFilename);
  const playbackPath = resolvePath(baseDir, manifestsDir, playbackFilename);
  const slugTreePath = resolvePath(baseDir, manifestsDir, slugTreeFilename);

  const assetsRaw = toRawPath(baseDir, assetsPath);
  const playbackRaw = toRawPath(baseDir, playbackPath);
  const slugTreeRaw = toRawPath(baseDir, slugTreePath);

  const pushAssetsManifestError = (path: string, message: string) => {
    const issue: t.LintSequenceFilepath = {
      kind: 'sequence:assets:not-exported',
      severity: 'error',
      path,
      raw: assetsRaw,
      resolvedPath: '',
      doc: { id: docid },
      message,
    };
    issues.push(issue);
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

    const destDir = resolvePath(baseDir, kindDir);
    const destPath = Fs.join(destDir, filename);

    await Fs.ensureDir(destDir);
    if (!(await Fs.exists(destPath))) await Fs.copy(resolvedPath, destPath);

    const stat = await Fs.stat(resolvedPath);
    const bytes = Is.number(stat?.size) ? stat.size : undefined;
    const href = `${baseHref}/${kindDir}/${filename}`;

    let duration: t.Msecs | undefined;
    if (kind === 'video') {
      const result = await Ffmpeg.duration(resolvedPath);
      if (result.ok) duration = result.msecs;
    }

    assets.push({
      kind,
      logicalPath: String(raw),
      hash,
      filename,
      href,
      stats: { bytes, duration },
    });
  };

  await walkSequenceMediaPaths(dag, yamlPath, docid, facets, visit);

  /**
   * Write asset manifest.
   */
  // Emit an assets manifest only when bundling recorded entries; an empty list
  // indicates nothing produced, so no manifest is written.
  if (assets.length > 0) {
    const manifest: t.SlugAssetsManifest = { docid, assets };
    const res = Slug.Schema.Manifest.Validate.assets(manifest);
    if (!res.ok) {
      const err = `Assets manifest failed @sys/schema validation. Reason: ${res.error.message}`;
      pushAssetsManifestError(yamlPathStr, err);
    } else {
      await Fs.write(assetsPath, Json.stringify(res.sequence));
    }
  }

  /**
   * Attempt to derive and validate playback manifest.
   */
  const Playback = Slug.Trait.MediaComposition.Playback;
  const playbackResult = await Playback.fromDag(dag, yamlPath, docid, {
    validate: true,
    trait: { of: 'media-composition' },
  });

  const manifestDir = Fs.dirname(playbackPath);
  await Fs.ensureDir(manifestDir);

  const pushNotExportedError = (path: string, message: string) => {
    const issue: t.LintSequenceFilepath = {
      kind: 'sequence:playback:not-exported',
      severity: 'error',
      path,
      raw: playbackRaw,
      resolvedPath: '',
      doc: { id: docid },
      message,
    };
    issues.push(issue);
  };

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
    const res = Slug.Schema.Manifest.Validate.playback(candidate);

    if (!res.ok) {
      pushNotExportedError(
        yamlPathStr,
        `Playback manifest failed @sys/schema validation. Reason: ${res.error.message}`,
      );
    } else {
      await Fs.write(playbackPath, Json.stringify(res.sequence));
    }
  }

  const pushSlugTreeError = (message: string) => {
    const issue: t.LintSequenceFilepath = {
      kind: 'sequence:slug-tree:not-exported',
      severity: 'error',
      path: yamlPathStr,
      raw: slugTreeRaw,
      resolvedPath: '',
      doc: { id: docid },
      message,
    };
    issues.push(issue);
  };

  const slugTreeResult = await Slug.Tree.fromDag(dag, yamlPath, docid, {
    validate: true,
    trait: { of: 'slug-tree' },
  });

  if (!slugTreeResult.ok) {
    const reason = slugTreeResult.error?.message ?? 'Unknown validation error.';
    const isNotApplicable =
      reason.includes('does not advertise required trait') && reason.includes('of:"slug-tree"');

    if (!isNotApplicable) {
      pushSlugTreeError(`Slug-tree manifest could not be generated. Reason: ${reason}`);
    }
  } else {
    await Fs.write(slugTreePath, Json.stringify(slugTreeResult.sequence));
  }

  return Obj.asGetter({ dir, issues }, ['issues']);
}

function resolveTemplate(value: string, docid: t.StringId): string {
  return value.includes('<docid>') ? value.replaceAll('<docid>', String(docid)) : value;
}

function resolvePath(baseDir: string, subPath: string, filename?: string): string {
  if (filename && Fs.Path.Is.absolute(filename)) return filename;
  if (Fs.Path.Is.absolute(subPath)) {
    return filename ? Fs.join(subPath, filename) : subPath;
  }
  return filename ? Fs.join(baseDir, subPath, filename) : Fs.join(baseDir, subPath);
}

function toRawPath(baseDir: string, path: string): string {
  const rel = Fs.Path.relative(baseDir, path);
  return rel || Fs.basename(path);
}
