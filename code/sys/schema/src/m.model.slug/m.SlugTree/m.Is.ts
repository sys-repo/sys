import { Arr, Is as StdIs, type t } from './common.ts';

type Ref = { ref: string };
type Base = { slug: string; slugs?: t.SlugTreeItem[] };

export const Is: t.SlugTreeSchemaIsLib = {
  items(value): value is t.SlugTreeItems {
    return Arr.isArray(value) && value.every((entry) => isItem(entry));
  },
  item(value): value is t.SlugTreeItem {
    return isItem(value);
  },
  refOnly(value): value is t.SlugTreeItemRefOnly {
    return hasValidBase(value) && hasRef(value);
  },
  inline(value): value is t.SlugTreeItemInline {
    return hasValidBase(value) && lacksRef(value);
  },
};

/**
 * Helpers
 */

function isItem(value: unknown): value is t.SlugTreeItem {
  return hasValidBase(value) && (hasRef(value) || lacksRef(value));
}

function hasValidChildren(value: unknown): value is t.SlugTreeItem[] {
  return Arr.isArray(value) && value.every((entry) => isItem(entry));
}

function hasValidBase(value: unknown): value is Base {
  if (!StdIs.record(value)) return false;

  const slug = (value as { slug?: unknown }).slug;
  if (!StdIs.str(slug) || slug.length === 0) return false;

  if ('slugs' in value) {
    const slugs = (value as { slugs?: unknown }).slugs;
    if (slugs !== undefined && !hasValidChildren(slugs)) return false;
  }

  return true;
}

function hasRef(value: unknown): value is Ref {
  const ref = (value as { ref?: unknown }).ref;
  return StdIs.str(ref) && ref.length > 0;
}

function lacksRef(value: unknown): boolean {
  return !('ref' in (value as object));
}
