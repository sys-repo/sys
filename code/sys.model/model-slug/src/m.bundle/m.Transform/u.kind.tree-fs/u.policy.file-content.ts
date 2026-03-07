import { type t, Hash, SlugSchema } from './common.ts';
import { readFrontmatter } from './u.frontmatter.ts';
import { deriveIndex, toEntry, toSha256Filename } from './u.file-content.ts';
import { normalizeManifestTargets, resolveDocid } from './u.docid.ts';
import { deriveAssetsPath, normalizeFilePath, toContentType } from './u.path.ts';

export const derive: t.SlugBundleTransform.TreeFs.Lib['derive'] = async (args) => {
  try {
    const docs: t.SlugFileContentDoc[] = [];
    const entries: t.SlugFileContentEntry[] = [];
    const sha256: t.SlugBundleTransform.TreeFs.Sha256DocHint[] = [];
    for (const file of args.files) {
      const rel = normalizeFilePath(file.path);
      const source = String(file.source ?? '');
      const hash = Hash.sha256(source);
      const contentType = toContentType(rel);
      const frontmatter = readFrontmatter(source, rel);
      const payload: t.SlugFileContentDoc = args.includePath
        ? { source, path: rel, hash, contentType, frontmatter }
        : { source, hash, contentType, frontmatter };
      const validation = SlugSchema.FileContent.validate(payload);
      if (!validation.ok) throw new Error(`Invalid slug-file-content payload for: ${rel}`);
      const doc = validation.sequence;
      docs.push(doc);
      entries.push(toEntry(doc));
      sha256.push({
        hash: doc.hash,
        filename: toSha256Filename(doc.hash),
        doc,
      });
    }

    const docid = resolveDocid(args.docid, args.manifests);
    const assetsTargets = deriveAssetsTargets(args.manifests);
    const index = docid && entries.length > 0 ? deriveIndex(docid, entries) : undefined;
    return { ok: true, value: { docs, entries, sha256, docid, assetsTargets, index } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

function deriveAssetsTargets(
  manifests?: t.SlugBundleTransform.TreeFs.ManifestTargetsInput,
): readonly t.StringFile[] {
  const targets = normalizeManifestTargets(manifests);
  const derived = targets.map(deriveAssetsPath).filter((v): v is t.StringFile => !!v);
  return derived;
}
