import type { t } from './common.ts';
import { accepted, failure, rejected, validate } from './u.reply.ts';

/** Verify against the captured credential, then prepare against current authority without suspension. */
export function createSignIn(authority: t.ServiceAuthority, policy: t.Policy, deps: t.ServiceDeps) {
  const { transactions } = authority;
  return signIn;

  async function signIn(
    input: t.Accounts.Finish<t.Accounts.Wire.Authentication>,
  ): Promise<t.Accounts.Result['session.signIn.finish']> {
    const tx = transactions.get(input.transaction);
    if (!tx || tx.used || tx.purpose !== 'signIn') return rejected('invalid-transaction');
    if (tx.expiresAt <= authority.now()) return rejected('invalid-transaction');
    tx.used = true;
    try {
      const stored = authority.current.credentials.get(input.response.id);
      if (!stored) return rejected('verification-rejected');
      if (input.response.response.userHandle !== stored.account.handle) {
        return rejected('verification-rejected');
      }
      const verified = await deps.verifier.authentication(
        input.response,
        tx.challenge,
        stored,
        policy,
      );
      if (authority.disposed) throw failure();
      if (!verified) return rejected('verification-rejected');
      if (tx.expiresAt <= authority.now()) return rejected('invalid-transaction');
      if (authority.current.credentials.get(input.response.id) !== stored) {
        return rejected('state-changed');
      }
      authority.prune();
      if (authority.current.sessions.size >= policy.capacity.sessions) return rejected('capacity');
      const next = authority.cloneState();
      next.credentials.set(input.response.id, {
        account: stored.account,
        credential: { ...stored.credential, counter: verified.counter },
        deviceType: verified.deviceType,
        backedUp: verified.backedUp,
      });
      const result = accepted(authority.grant(next, stored.account));
      validate('session.signIn.finish', result);
      if (tx.expiresAt <= authority.now()) return rejected('invalid-transaction');
      authority.publish(next);
      return result;
    } finally {
      transactions.delete(input.transaction);
    }
  }
}
