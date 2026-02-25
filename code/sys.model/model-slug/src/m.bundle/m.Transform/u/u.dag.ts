import { type t, Is } from './common.ts';

/**
 * Boundary guard for the transform's opaque DAG input.
 * This is intentionally minimal: policy modules only require `dag.nodes[]`.
 */
export function isDagLike(input: unknown): input is t.SlugBundleTransform.Dag.Shape {
  return Is.record(input) && Is.array((input as { nodes?: unknown }).nodes);
}
