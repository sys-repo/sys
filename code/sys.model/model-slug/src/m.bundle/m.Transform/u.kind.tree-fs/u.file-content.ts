import { type t, Schema, SlugSchema } from './common.ts';

export function toSha256Filename(hash: string): t.StringFile {
  return `${hash}.json` as t.StringFile;
}

export function toEntry(doc: t.SlugFileContentDoc): t.SlugFileContentEntry {
  const { source: _source, ...rest } = doc;
  return rest;
}

export function deriveIndex(
  docid: t.StringId,
  entries: readonly t.SlugFileContentEntry[],
): t.SlugFileContentIndex {
  const index: t.SlugFileContentIndex = { docid, entries: [...entries] };
  const ok = Schema.Value.Check(SlugSchema.FileContent.Index, index);
  if (!ok) throw new Error(`Invalid slug-file-content index: ${docid}`);
  return index;
}
