import type { Repo } from '@automerge/automerge-repo';
import type { t } from './common.ts';

export const REF = Symbol('ref:repo');

/**
 * Extract the hidden automerge Repo from a [CrdtRepo].
 */
export function toAutomergeRepo(repo?: t.CrdtRepo): Repo | undefined {
  if (!repo) return;
  return (repo as any)[REF];
}
