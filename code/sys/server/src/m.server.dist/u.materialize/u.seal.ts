import { Is, type t } from './common.ts';
import { causeReason } from './u.failure.ts';

type Rooted = t.FsRooted.Instance;
type Generation = t.FsRooted.Target<'directory'>;

export type SealTargetResult =
  | { readonly ok: true; readonly seal: t.FsRooted.SealApplied }
  | { readonly ok: false; readonly reason: t.Dist.FailureReason };

/** Inspect, apply, and snapshot lower-owner seal evidence for one generation target. */
export async function sealTarget(
  rooted: Rooted,
  generation: Generation,
  lease: t.FsRooted.Lease,
  isFailure: t.FsRooted.IsLib['failure'],
  until?: t.UntilInput,
): Promise<SealTargetResult> {
  const options: t.FsRooted.OwnedTreeOptions = {
    lease,
    ...(until === undefined ? {} : { until }),
  };
  try {
    const inspection = await rooted.Tree.inspectSeal(generation, options);
    if (inspection.kind === 'unsupported') {
      return Object.freeze({ ok: false, reason: 'unsupported' });
    }

    const result = await rooted.Tree.seal(generation, options);
    if (result.kind === 'unsupported') {
      return Object.freeze({ ok: false, reason: 'unsupported' });
    }
    const seal = snapshotAppliedSeal(result);
    return seal
      ? Object.freeze({ ok: true, seal })
      : Object.freeze({ ok: false, reason: 'filesystem-failure' });
  } catch (cause) {
    return Object.freeze({ ok: false, reason: causeReason(cause, isFailure) });
  }
}

/** Copy only exact applied-seal evidence so lower mutable objects cannot rewrite settlement. */
export function snapshotAppliedSeal(input: unknown): t.FsRooted.SealApplied | undefined {
  try {
    if (!Is.plainObject(input)) return undefined;
    const kind = Reflect.getOwnPropertyDescriptor(input, 'kind');
    const changed = Reflect.getOwnPropertyDescriptor(input, 'changed');
    if (
      !kind ||
      !('value' in kind) ||
      kind.value !== 'applied' ||
      !changed ||
      !('value' in changed) ||
      !Is.bool(changed.value)
    ) {
      return undefined;
    }
    return Object.freeze({ kind: 'applied', changed: changed.value });
  } catch {
    return undefined;
  }
}
