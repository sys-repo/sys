import { Arr, Is as StdIs, type t } from './common.ts';

export const Is: t.SlugFileContentSchemaIsLib = {
  doc(value): value is t.SlugFileContentDoc {
    if (!StdIs.record(value)) return false;

    const doc = value as {
      source?: unknown;
      path?: unknown;
    };

    if (!StdIs.str(doc.source)) return false;
    if (!isEntry(value)) return false;
    if ('path' in doc && doc.path !== undefined && !StdIs.str(doc.path)) return false;

    return true;
  },
  entry(value): value is t.SlugFileContentEntry {
    return isEntry(value);
  },
  index(value): value is t.SlugFileContentIndex {
    if (!StdIs.record(value)) return false;
    const docid = (value as { docid?: unknown }).docid;
    if (!StdIs.str(docid) || docid.length === 0) return false;
    const entries = (value as { entries?: unknown }).entries;
    if (!Arr.isArray(entries)) return false;
    return (entries as unknown[]).every((entry: unknown) => isEntry(entry));
  },
};

function isEntry(value: unknown): value is t.SlugFileContentEntry {
  if (!StdIs.record(value)) return false;

  const entry = value as {
    hash?: unknown;
    contentType?: unknown;
    frontmatter?: unknown;
    path?: unknown;
  };

  if (!StdIs.str(entry.hash) || entry.hash.length === 0) return false;
  if (!StdIs.str(entry.contentType) || entry.contentType.length === 0) return false;
  if (!StdIs.record(entry.frontmatter)) return false;

  const ref = (entry.frontmatter as { ref?: unknown }).ref;
  if (ref !== undefined && (!StdIs.str(ref) || ref.length === 0)) return false;

  if ('title' in (entry.frontmatter as object)) {
    const title = (entry.frontmatter as { title?: unknown }).title;
    if (title !== undefined && !StdIs.str(title)) return false;
  }

  if ('path' in entry && entry.path !== undefined && !StdIs.str(entry.path)) return false;

  return true;
}
