import type { t } from '../common.ts';

type Failure = Exclude<t.AccountRuntime.Action.Outcome, { kind: 'accepted' }>;
type Reason = Extract<Failure, { kind: 'not-submitted' }>['reason'];
type GrantAttempt = t.Accounts.Attempt<'account.create.finish' | 'session.signIn.finish'>;

export function notSubmitted<R extends Reason>(reason: R) {
  return { kind: 'not-submitted', reason } as const;
}

/** A lost begin can leave a challenge, but the mutation has not been submitted. */
export function failedBegin(result: Failure, signal: AbortSignal): t.Completion {
  // Cancellation can stop the next phase, not erase an admitted refusal (notably no-session).
  if (result.kind === 'rejected') return failedMutation(result);
  if (signal.aborted) return { outcome: notSubmitted('cancelled') };
  return { outcome: result.kind === 'indeterminate' ? notSubmitted('unavailable') : result };
}

/** Failure never supplies new authority. A confirmed missing session discards the old one. */
export function failedMutation(outcome: Failure): t.Completion {
  if (outcome.kind === 'indeterminate') return { outcome, session: { kind: 'unknown' } };
  if (outcome.kind === 'rejected' && outcome.code === 'no-session') {
    return { outcome, session: { kind: 'signed-out' } };
  }
  return { outcome };
}

/** Check usability here; only the owning slot may install the grant on settlement. */
export function granted(result: GrantAttempt): t.Completion {
  if (result.kind !== 'accepted') return failedMutation(result);
  if (!/^[A-Za-z0-9._~+/-]+=*$/.test(result.value.credential)) {
    return failedMutation({ kind: 'indeterminate' });
  }
  return { outcome: { kind: 'accepted' }, grant: result.value };
}

export function enrolled(
  access: t.Accounts.Grant,
  result: t.Accounts.Attempt<'passkey.add.finish'>,
): t.Completion {
  if (result.kind !== 'accepted') return failedMutation(result);
  const session = observe(access, result.value);
  const outcome = session.kind === 'unknown' ? 'indeterminate' : 'accepted';
  return { outcome: { kind: outcome }, session };
}

/** An observation must describe the same principal and absolute session lifetime. */
export function observe(
  access: t.Accounts.Grant,
  value: t.Accounts.Session,
): t.AccountRuntime.Session {
  if (value.account.principal !== access.session.account.principal) return { kind: 'unknown' };
  if (value.expiresAt !== access.session.expiresAt) return { kind: 'unknown' };
  return { kind: 'signed-in', value };
}
