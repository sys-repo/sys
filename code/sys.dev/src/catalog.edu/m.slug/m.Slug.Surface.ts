import { type t, Is } from './common.ts';

export const SlugSurface: t.SlugSurfaceLib = {
  /**
   * Extract the inline surface (id?, description?, ref?, traits?, data?) from a SlugTreeItem.
   * Note: SlugTreeItem does not define `id`, so only present fields are copied.
   */
  fromTreeItem(node): t.SlugSurface {
    if (!Is.record(node)) {
      // During live YAML editing, array slots can be `null`/scalar.
      // Return the empty surface rather than throwing.
      return {} as t.SlugSurface;
    }

    const out: Record<string, unknown> = {};

    // Copy only fields that exist on SlugTreeItem:
    if ('description' in node && node.description !== undefined) out.description = node.description;
    if ('ref' in node && node.ref !== undefined) out.ref = node.ref;
    if ('traits' in node && node.traits !== undefined) out.traits = node.traits;
    if ('data' in node && node.data !== undefined) out.data = node.data;

    // Cast to the <readonly> surface shape (safe: we only set known keys).
    return out as t.SlugSurface;
  },
};
