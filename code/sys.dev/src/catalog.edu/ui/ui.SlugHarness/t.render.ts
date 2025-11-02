import type { t } from './common.ts';

/**
 * Minimal registry for SlugView renderers.
 * Pure id → renderer map.
 */
export type SlugViewId = t.StringId;

/**
 * Snapshot of a slug exactly as authored in YAML (schema-aligned).
 */
export type SlugViewProps = {
  readonly view: t.SlugViewId;
  readonly slug: t.Slug;
  readonly path: { readonly doc?: t.ObjectPath; readonly slug?: t.ObjectPath };
  readonly doc?: t.Crdt.Ref;
  readonly props?: t.PropertyBag | t.StringCrdtRef;
  readonly theme?: t.CommonTheme;
};

/** Opaque renderer. */
export type SlugViewRenderer = (args: SlugViewProps) => t.ReactNode;

/** Optional metadata (exposed for external selectors). */
export type SlugViewMeta = {
  readonly aliases?: readonly SlugViewId[];
};
