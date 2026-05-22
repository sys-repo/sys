import { type t, Is } from '../common.ts';

export function fromNode(node?: t.SlugTreeItem): t.SlugSurface {
  if (!Is.record(node)) return {} as t.SlugSurface;

  const out: Record<string, unknown> = {};
  const n = node as Record<string, unknown>;

  if (n.description !== undefined) out.description = n.description;
  if (n.ref !== undefined) out.ref = n.ref;
  if (n.traits !== undefined) out.traits = n.traits;
  if (n.data !== undefined) out.data = n.data;

  return out as t.SlugSurface;
}
