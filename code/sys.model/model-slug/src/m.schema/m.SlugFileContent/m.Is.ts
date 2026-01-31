import { Is as StdIs, type t } from './common.ts';

export const Is: t.SlugFileContentSchemaIsLib = {
  doc(value): value is t.SlugFileContentDoc {
    if (!StdIs.record(value)) return false;

    const doc = value as {
      source?: unknown;
      hash?: unknown;
      contentType?: unknown;
      frontmatter?: unknown;
      path?: unknown;
    };

    if (!StdIs.str(doc.source)) return false;
    if (!StdIs.str(doc.hash) || doc.hash.length === 0) return false;
    if (!StdIs.str(doc.contentType) || doc.contentType.length === 0) return false;
    if (!StdIs.record(doc.frontmatter)) return false;

    const ref = (doc.frontmatter as { ref?: unknown }).ref;
    if (!StdIs.str(ref) || ref.length === 0) return false;

    if ('title' in (doc.frontmatter as object)) {
      const title = (doc.frontmatter as { title?: unknown }).title;
      if (title !== undefined && !StdIs.str(title)) return false;
    }

    if ('path' in doc && doc.path !== undefined && !StdIs.str(doc.path)) return false;

    return true;
  },
};
