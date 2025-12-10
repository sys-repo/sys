import { type t, Fs, Hash, Obj, Json, Slug } from './common.ts';
import { buildSequenceFilepathIssue } from './u.lint.seq.files.ts';
import { walkSequenceMediaPaths } from './u.lint.seq.files.walk.ts';

type R = t.SequenceFilepathBundleResult;
type Dag = t.Graph.Dag.Result;
type Facet = t.DocLintFacet;

/**
 * Bundle all media file paths for a given document:
 * - Uses the shared media-path walker (video + image).
 * - Reuses `buildSequenceFilepathIssue` for *all* lint behaviour.
 * - When there is no issue for a path, hashes + copies the file into a flat
 *   output dir and records it in `slug.<docid>.assets.json`.
 */
export async function bundleSequenceFilepaths(
  dag: Dag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts: { facets?: Facet[]; outDir?: string; baseHref?: string } = {},
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

    const hash = await sha256Hex(resolvedPath);
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
    let manifestPath: string | undefined;
    const manifest: t.SlugAssetsManifest = { docid, assets };
    const manifestFilename = `${dir.manifests}/slug.${docid}.assets.json`;
    manifestPath = Fs.join(dir.base, manifestFilename);
    await Fs.writeJson(manifestPath, manifest);
  }

  // Finish up.
  return Obj.asGetter({ issues, dir }, ['issues']);
}

/**
 * Compute the SHA-256 hash of a file as a hex string.
 */
async function sha256Hex(path: string): Promise<t.StringHash> {
  const data = (await Fs.read(path)).data;
  return Hash.sha256(data);
}
