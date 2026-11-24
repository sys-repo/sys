import { generateAuthenticationOptions, generateRegistrationOptions } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { Random, type t } from './common.ts';
import { fresh } from './u.authority.ts';
import { accepted, failure, rejected, validate } from './u.reply.ts';

/** Reserve a challenge slot before option generation; retain it only after result admission. */
export function createBegin(authority: t.ServiceAuthority, policy: t.Policy) {
  const { transactions } = authority;
  return begin;

  async function begin(purpose: 'create'): Promise<t.Accounts.Result['account.create.begin']>;
  async function begin(purpose: 'signIn'): Promise<t.Accounts.Result['session.signIn.begin']>;
  async function begin(
    purpose: 'add',
    bearer?: string,
  ): Promise<t.Accounts.Result['passkey.add.begin']>;
  async function begin(purpose: t.Purpose, bearer?: string): Promise<t.BeginReply> {
    const session = purpose === 'add' ? authority.live(bearer) : undefined;
    if (purpose === 'add' && !session) return rejected('no-session');
    if (transactions.size >= policy.capacity.transactions) return rejected('capacity');
    const account = purpose === 'create'
      ? {
        principal: fresh(authority.current.accounts),
        handle: Random.base36(40),
        label: `sample.${Random.slug()}`,
      }
      : session?.account;
    const id = fresh(transactions);
    const tx: t.Transaction = {
      purpose,
      account,
      session,
      bearer,
      expiresAt: authority.expiry(policy.lifetimes.challenge),
      challenge: '',
      used: true,
    };
    transactions.set(id, tx);
    let retained = false;
    try {
      const options = account
        ? await generateRegistrationOptions({
          rpID: policy.rp.id,
          rpName: policy.rp.name,
          userID: isoBase64URL.toBuffer(account.handle),
          userName: account.label,
          userDisplayName: account.label,
          timeout: policy.lifetimes.challenge,
          attestationType: 'none',
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
          supportedAlgorithmIDs: [...policy.algorithms],
          excludeCredentials: [...authority.current.credentials.values()]
            .filter((value) => value.account === account)
            .map((value) => ({ id: value.credential.id })),
        })
        : await generateAuthenticationOptions({
          rpID: policy.rp.id,
          timeout: policy.lifetimes.challenge,
          userVerification: 'required',
        });
      const result = accepted({ transaction: id, expiresAt: tx.expiresAt, options });
      validate(
        purpose === 'create'
          ? 'account.create.begin'
          : purpose === 'add'
          ? 'passkey.add.begin'
          : 'session.signIn.begin',
        result,
      );
      if (authority.disposed) throw failure();
      if (tx.expiresAt <= authority.now()) throw failure();
      if (purpose === 'add' && authority.live(bearer) !== session) return rejected('no-session');
      tx.challenge = options.challenge;
      tx.used = false;
      retained = true;
      return result;
    } finally {
      if (!retained) transactions.delete(id);
    }
  }
}
