import type { t } from './common.ts';
import { accepted, failure, rejected, validate } from './u.reply.ts';

/** Creation and enrollment share one irreversible claim → verify → publish lifecycle. */
export function createRegister(
  authority: t.ServiceAuthority,
  policy: t.Policy,
  deps: t.ServiceDeps,
) {
  const { transactions } = authority;
  return register;

  async function register(
    purpose: 'create',
    input: t.Accounts.Finish<t.Accounts.Wire.Registration>,
  ): Promise<t.Accounts.Result['account.create.finish']>;
  async function register(
    purpose: 'add',
    input: t.Accounts.Finish<t.Accounts.Wire.Registration>,
    bearer?: string,
  ): Promise<t.Accounts.Result['passkey.add.finish']>;
  async function register(
    purpose: 'create' | 'add',
    input: t.Accounts.Finish<t.Accounts.Wire.Registration>,
    bearer?: string,
  ): Promise<t.RegistrationReply> {
    const tx = transactions.get(input.transaction);
    if (!tx || tx.used || tx.purpose !== purpose) return rejected('invalid-transaction');
    if (tx.expiresAt <= authority.now()) return rejected('invalid-transaction');
    if (purpose === 'add') {
      if (tx.bearer !== bearer) return rejected('no-session');
      if (!tx.session) return rejected('no-session');
      if (authority.live(bearer) !== tx.session) return rejected('no-session');
    }
    tx.used = true; // Exclusive, irreversible reservation before the verifier is invoked.
    try {
      const verified = await deps.verifier.registration(input.response, tx.challenge, policy);
      if (authority.disposed) throw failure();
      if (!verified) return rejected('verification-rejected');
      if (tx.expiresAt <= authority.now()) return rejected('invalid-transaction');
      if (purpose === 'add' && authority.live(bearer) !== tx.session) return rejected('no-session');
      const account = tx.account;
      if (!account) throw failure();
      if (purpose === 'add' && authority.current.accounts.get(account.principal) !== account) {
        return rejected('state-changed');
      }
      if (purpose === 'create' && authority.current.accounts.has(account.principal)) {
        return rejected('state-changed');
      }
      const credential = verified.credential;
      if (authority.current.credentials.has(credential.id)) return rejected('credential-conflict');
      authority.prune();
      if (authority.current.credentials.size >= policy.capacity.credentials) {
        return rejected('capacity');
      }
      if (purpose === 'create') {
        if (authority.current.accounts.size >= policy.capacity.accounts) {
          return rejected('capacity');
        }
        if (authority.current.sessions.size >= policy.capacity.sessions) {
          return rejected('capacity');
        }
      }
      // All allocation and result preparation precede one non-suspending authority publication.
      const next = authority.cloneState();
      next.accounts.set(account.principal, account);
      next.credentials.set(credential.id, {
        ...verified,
        account,
        credential: {
          ...credential,
          publicKey: credential.publicKey.slice(),
          transports: credential.transports?.slice(),
        },
      });
      const value = purpose === 'create'
        ? authority.grant(next, account)
        : authority.observe(tx.session!, next);
      const result = accepted(value);
      validate(purpose === 'create' ? 'account.create.finish' : 'passkey.add.finish', result);
      // Preparation can consume time without suspending. Recheck at the publication boundary.
      const time = authority.now();
      if (tx.expiresAt <= time) return rejected('invalid-transaction');
      if (purpose === 'add') {
        if (!tx.session) return rejected('no-session');
        if (tx.session.expiresAt <= time) return rejected('no-session');
        if (authority.current.sessions.get(bearer!) !== tx.session) return rejected('no-session');
      }
      authority.publish(next);
      return result;
    } finally {
      transactions.delete(input.transaction);
    }
  }
}
