import { Arr, Is as StdIs, type t } from './common.ts';

export const Is: t.SlugTreeSchemaIsLib = {
  items,
  item: isItem,
  refOnly,
  inline,
} as const;

function hasValidChildren(value: unknown): value is readonly t.SlugTreeItem[] {
  return Arr.isArray(value) && value.every(isItem);
}

function hasValidBase(value: unknown): value is {
  readonly slug: string;
  readonly slugs?: readonly t.SlugTreeItem[];
} {
  if (!StdIs.record(value)) return false;

  const slug = (value as { slug?: unknown }).slug;
  if (!StdIs.str(slug) || slug.length === 0) return false;

  if ('slugs' in value) {
    const slugs = (value as { slugs?: unknown }).slugs;
    if (slugs !== undefined && !hasValidChildren(slugs)) return false;
  }

  return true;
}

function refOnly(value: unknown): value is t.SlugTreeItemRefOnly {
  if (!hasValidBase(value)) return false;
  if (!('ref' in value)) return false;

  const ref = (value as { ref?: unknown }).ref;
  if (!StdIs.str(ref) || ref.length === 0) return false;

  return true;
}

function inline(value: unknown): value is t.SlugTreeItemInline {
  if (!hasValidBase(value)) return false;
  if ('ref' in value) return false;

  return true;
}

function isItem(value: unknown): value is t.SlugTreeItem {
  return refOnly(value) || inline(value);
}

function items(value: unknown): value is readonly t.SlugTreeItem[] {
  return Arr.isArray(value) && value.every(isItem);
}
