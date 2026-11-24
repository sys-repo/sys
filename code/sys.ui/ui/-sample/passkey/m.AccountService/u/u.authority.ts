import { Num, Obj, Random, type t } from './common.ts';
import { failure } from './u.reply.ts';

/** One instance's private authority owner; current state and disposal are live getters. */
export function createAuthority(policy: t.Policy, clock: () => number): t.ServiceAuthority {
  let state: t.AuthorityState = {
    accounts: new Map(),
    credentials: new Map(),
    sessions: new Map(),
  };
  const transactions = new Map<string, t.Transaction>();
  let disposed = false;
  let lastTime = 0;

  function now() {
    const value = clock();
    if (!Num.Is.safeInt(value) || value < 0) throw failure();
    return lastTime = Math.max(lastTime, value);
  }
  function expiry(duration: number) {
    const value = now() + duration;
    if (!Num.Is.safeInt(value)) throw failure();
    return value;
  }
  function prune() {
    const time = now();
    for (const [id, value] of transactions) {
      // Preparing/claimed work retains its slot until settlement, even after expiry.
      if (!value.used && value.expiresAt <= time) transactions.delete(id);
    }
    for (const [id, value] of state.sessions) {
      if (value.expiresAt <= time) state.sessions.delete(id);
    }
  }
  function live(bearer?: string) {
    const session = bearer ? state.sessions.get(bearer) : undefined;
    if (!session) return undefined;
    if (session.expiresAt <= now()) return undefined;
    return session;
  }
  function observe(session: t.StoredSession, authority = state): t.Accounts.Session {
    let credentialCount = 0;
    for (const credential of authority.credentials.values()) {
      if (credential.account === session.account) credentialCount++;
    }
    const { principal, label } = session.account;
    return Obj.deepFreeze({
      account: { principal, label, credentialCount },
      expiresAt: session.expiresAt,
    });
  }
  function cloneState(): t.AuthorityState {
    return {
      accounts: new Map(state.accounts),
      credentials: new Map(state.credentials),
      sessions: new Map(state.sessions),
    };
  }
  function grant(next: t.AuthorityState, account: t.Account): t.Accounts.Grant {
    const credential = fresh(next.sessions);
    const session = { account, expiresAt: expiry(policy.lifetimes.session) };
    next.sessions.set(credential, session);
    return Obj.deepFreeze({ credential, session: observe(session, next) });
  }
  function dispose() {
    disposed = true;
    transactions.clear();
    state = { accounts: new Map(), credentials: new Map(), sessions: new Map() };
  }

  return Object.freeze({
    get current() {
      return state;
    },
    get disposed() {
      return disposed;
    },
    transactions,
    now,
    expiry,
    prune,
    live,
    observe,
    cloneState,
    grant,
    // The caller owns all fallible preparation and publication guards; this step cannot suspend.
    publish(next: t.AuthorityState) {
      state = next;
    },
    dispose,
  });
}

/** Instance-local uniqueness check; a random collision is a failure, never silent replacement. */
export function fresh(records: ReadonlyMap<string, unknown>) {
  const value = Random.base36(40);
  if (records.has(value)) throw failure();
  return value;
}
