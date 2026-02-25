import { Is } from './common.ts';

export type DagNodeLike = {
  id: string;
  doc?: { current?: unknown };
};

export type DagLike = {
  nodes?: DagNodeLike[];
} & Record<string, unknown>;

/**
 * Boundary guard for the transform's opaque DAG input.
 * This is intentionally minimal: policy modules only require `dag.nodes[]`.
 */
export function isDagLike(input: unknown): input is DagLike {
  return Is.record(input) && Is.array((input as { nodes?: unknown }).nodes);
}
