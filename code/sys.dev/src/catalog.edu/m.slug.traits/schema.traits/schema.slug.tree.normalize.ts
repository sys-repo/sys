import { type t, Is } from './common.ts';

type O = Record<string, unknown>;

export const slugTreeNormalizer: t.SlugTreeYamlNormalizer = (input: unknown) => {
  // Idempotent: if already canonical, return as-is.
  if (isCanonicalProps(input)) return input as t.SlugTreeProps;

  // Authoring DSL: array of single-key objects.
  if (Array.isArray(input)) {
    const slugs = (input as unknown[])
      .map(toItemFromEntry)
      .filter((v): v is t.SlugTreeItem => Boolean(v));
    return { slugs } as unknown as t.SlugTreeProps;
  }

  // Fallback: empty canonical.
  return { slugs: [] };
};

/**
 * Helpers:
 */
function has(u: unknown, k: string): boolean {
  return Is.record(u) && Object.prototype.hasOwnProperty.call(u, k);
}

function isCanonicalItem(u: unknown): u is t.SlugTreeItem {
  if (!Is.record(u)) return false;

  const name = (u as { name?: unknown }).name;
  if (!Is.string(name) || name.trim().length === 0) return false;

  const ref = (u as { ref?: unknown }).ref;
  if (ref !== undefined && !Is.string(ref)) return false;

  const slugs = (u as { slugs?: unknown }).slugs;
  if (slugs === undefined) return true;

  return Array.isArray(slugs) && slugs.every(isCanonicalItem);
}

function isCanonicalProps(u: unknown): u is t.SlugTreeProps {
  return (
    has(u, 'slugs') &&
    Array.isArray((u as { slugs?: unknown }).slugs) &&
    (u as { slugs: unknown[] }).slugs.every(isCanonicalItem)
  );
}

// Converts an authoring-DSL entry → canonical item.
// Accepts both modern `slugs` and legacy `items` arrays on authoring objects.
function toItemFromEntry(entry: unknown): t.SlugTreeItem | undefined {
  if (!Is.record(entry)) return undefined;

  const keys = Object.keys(entry);
  if (keys.length !== 1) return undefined;

  const name = keys[0];
  if (!Is.string(name) || name.trim().length === 0) return undefined;

  const val = entry[name];

  // String → leaf ref
  if (Is.string(val)) return { name, ref: val } as unknown as t.SlugTreeItem;

  if (Is.record(val)) {
    const ref = Is.string(val.ref) ? String(val.ref) : undefined;
    const summary = Is.string(val.summary) ? String(val.summary) : undefined;

    // Prefer modern `slugs`; fall back to legacy `items` if present.
    const childrenSrc = Array.isArray(val.slugs)
      ? val.slugs
      : Array.isArray(val.items)
        ? val.items
        : undefined;

    const kids = childrenSrc
      ? (childrenSrc as unknown[])
          .map(toItemFromEntry)
          .filter((v): v is t.SlugTreeItem => Boolean(v))
      : undefined;

    // Build canonical item with `slugs` (not `items`).
    const item: {
      name: string;
      ref?: string;
      summary?: string;
      slugs?: readonly t.SlugTreeItem[];
    } = { name };

    if (ref) item.ref = ref;
    if (summary) item.summary = summary;
    if (kids && kids.length) item.slugs = kids;

    // Cast to library item type (runtime shape is canonical with `slugs`).
    return item as unknown as t.SlugTreeItem;
  }

  // Anything else → drop.
  return undefined;
}
