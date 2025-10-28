import { type t, Is } from './common.ts';

type O = Record<string, unknown>;

export const slugTreeNormalizer: t.SlugTreeYamlNormalizer = (input: unknown) => {
  // Idempotent: if already canonical, return as-is.
  if (isCanonicalProps(input)) return input as t.SlugTreeProps;

  // Authoring DSL: array of single-key objects.
  if (Array.isArray(input)) {
    const items = (input as unknown[])
      .map(toItemFromEntry)
      .filter((v): v is t.SlugTreeItem => Boolean(v));
    return { items };
  }

  // Fallback: empty canonical.
  return { items: [] };
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

  const items = (u as { items?: unknown }).items;
  if (items === undefined) return true;
  return Array.isArray(items) && items.every(isCanonicalItem);
}

function isCanonicalProps(u: unknown): u is t.SlugTreeProps {
  return (
    has(u, 'items') &&
    Array.isArray((u as { items?: unknown }).items) &&
    (u as { items: unknown[] }).items.every(isCanonicalItem)
  );
}

function toItemFromEntry(entry: unknown): t.SlugTreeItem | undefined {
  if (!Is.record(entry)) return undefined;

  const keys = Object.keys(entry);
  if (keys.length !== 1) return undefined;

  const name = keys[0];
  if (!Is.string(name) || name.trim().length === 0) return undefined;

  const val = (entry as O)[name];

  // String → leaf ref
  if (Is.string(val)) return { name, ref: val };

  // Object → { ref?, items? }
  if (Is.record(val)) {
    const ref = Is.string((val as O).ref) ? String((val as O).ref) : undefined;

    const kids = Array.isArray((val as O).items)
      ? ((val as O).items as unknown[])
          .map(toItemFromEntry)
          .filter((v): v is t.SlugTreeItem => Boolean(v))
      : undefined;

    const item: t.SlugTreeItem = { name };
    if (ref) (item as { ref?: string }).ref = ref;
    if (kids && kids.length) (item as { items?: t.SlugTreeItem[] }).items = kids;
    return item;
  }

  // Anything else → drop
  return undefined;
}
