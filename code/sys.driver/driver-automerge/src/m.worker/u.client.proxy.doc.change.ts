import { type t, A } from './common.ts';

type O = Record<string, unknown>;

/**
 * Apply an Immutable-style mutator to a plain snapshot using
 * an ephemeral Automerge doc, returning the new snapshot plus
 * the Automerge patches describing the change.
 */
export function changePatches<T extends O>(
  fn: t.ImmutableMutator<T>,
  current: T,
): { readonly after: T; readonly patches: readonly A.Patch[] } {
  // Seed ephemeral Automerge doc from the current plain JS snapshot.
  const beforeDoc: A.Doc<T> = A.from<T>(current);

  // Apply the user mutator inside an Automerge change, capturing patches.
  const patches: A.Patch[] = [];
  const afterDoc: A.Doc<T> = A.change<T>(
    beforeDoc,
    { patchCallback: (batch: A.Patch[]) => patches.push(...batch) },
    (draft: T) => fn(draft),
  );

  // Materialize the new plain JS snapshot.
  const after = A.toJS<T>(afterDoc);

  // Return the new snapshot and the collected patches.
  return { after, patches } as const;
}
