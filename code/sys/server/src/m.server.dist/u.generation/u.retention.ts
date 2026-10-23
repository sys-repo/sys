import type { t } from './common.ts';
import { isExactPromise } from './u.is.ts';

/** Captured lower release authority retained without exposing it publicly. */
export type LeaseAuthority = {
  readonly receiver: object;
  readonly release: () => unknown;
  readonly unobservable: Set<unknown>;
};

type FailedOpenRetention = {
  readonly lease?: LeaseAuthority;
  readonly evidence?: unknown;
};

const FAILED_OPEN_OWNERS = new Map<object, FailedOpenRetention>();
const RETURNED_PENDING_OWNERS = new Set<t.Dist.Generation.Owner>();
const apply = Reflect.apply;
const freeze = Object.freeze;

/** Settle one contract-valid lower release without assimilating opaque async values. */
export async function releaseLease(owner: LeaseAuthority): Promise<boolean> {
  let completion: unknown;
  try {
    completion = apply(owner.release, owner.receiver, []);
  } catch {
    return false;
  }
  try {
    if (!isExactPromise(completion)) {
      owner.unobservable.add(completion);
      return false;
    }
    return (await completion) === undefined;
  } catch {
    return false;
  }
}

/** Strongly retain a failed-open lease owner after its terminal release cannot be proved. */
export function retainFailedOpen(owner: LeaseAuthority): void {
  if (!FAILED_OPEN_OWNERS.has(owner)) {
    FAILED_OPEN_OWNERS.set(owner, freeze({ lease: owner }));
  }
}

/** Retain ownership without releasing behind an unobservable lower materialization operation. */
export function retainUnobservableOpen(owner: LeaseAuthority, operation: unknown): void {
  owner.unobservable.add(operation);
  FAILED_OPEN_OWNERS.set(owner, freeze({ lease: owner }));
}

/** Retain an unadmittable acquisition completion whose lack of ownership cannot be proved. */
export function retainOpaqueOpen(evidence: unknown): void {
  FAILED_OPEN_OWNERS.set(freeze({}), freeze({ evidence }));
}

/** Strongly retain a returned public owner while its release remains unproved. */
export function retainReturned(owner: t.Dist.Generation.Owner): void {
  RETURNED_PENDING_OWNERS.add(owner);
}

/** Forget a returned owner only after lower release has observably completed. */
export function releaseReturned(owner: t.Dist.Generation.Owner): void {
  RETURNED_PENDING_OWNERS.delete(owner);
}

/** Package-private retention evidence for deterministic owner-lifetime proof. */
export function retentionSnapshot(): Readonly<{
  failedOpen: number;
  returnedPending: number;
}> {
  return freeze({
    failedOpen: FAILED_OPEN_OWNERS.size,
    returnedPending: RETURNED_PENDING_OWNERS.size,
  });
}
