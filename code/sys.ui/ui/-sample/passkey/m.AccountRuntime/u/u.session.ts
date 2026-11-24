import { type t, Time } from '../common.ts';
import { failedMutation, notSubmitted, observe } from './u.completion.ts';

/** Private bearer and expiry timer for exactly one issuer and runtime lifetime. */
export function createSession(send: t.Send, onExpire: () => void) {
  let current: t.Accounts.Grant | undefined;
  let timer: t.Time.Delay.Handle | undefined;

  return {
    get current() {
      return current;
    },
    live,
    inspect,
    revoke,
    dropExpired,
    forget,
    adopt(grant: t.Accounts.Grant): t.AccountRuntime.Session {
      forget();
      if (expired(grant)) return { kind: 'signed-out' };
      current = grant;
      watch(grant);
      return { kind: 'signed-in', value: grant.session };
    },
  };

  async function inspect(
    slot: t.Pending,
    access: t.Accounts.Grant,
  ): Promise<t.AccountRuntime.Session | undefined> {
    if (!slot.phase('request') || !live(access)) return;
    const result = await send('session.inspect', {}, slot.signal, access.credential);
    if (result.kind !== 'accepted') return { kind: 'unknown' };
    return result.value ? observe(access, result.value) : { kind: 'signed-out' };
  }

  async function revoke(slot: t.Pending, access: t.Accounts.Grant): Promise<t.Completion> {
    if (!slot.phase('request')) return { outcome: notSubmitted('cancelled') };
    if (!live(access)) return { outcome: notSubmitted('invalid-input') };
    const result = await send('session.revoke', {}, slot.signal, access.credential);
    if (result.kind !== 'accepted') return failedMutation(result);
    return { outcome: { kind: 'accepted' }, session: { kind: 'signed-out' } };
  }

  function live(access: t.Accounts.Grant) {
    return current === access && !expired(access);
  }

  function expired(access: t.Accounts.Grant) {
    return access.session.expiresAt <= Time.now.timestamp;
  }

  function forget() {
    current = undefined;
    timer?.cancel();
    timer = undefined;
  }

  function dropExpired() {
    if (!current || !expired(current)) return false;
    forget();
    return true;
  }

  function watch(access: t.Accounts.Grant) {
    timer = Time.delay(access.session.expiresAt - Time.now.timestamp, () => {
      if (current !== access) return;
      if (dropExpired()) onExpire();
      else watch(access); // The timer may fire early after clamping or a wall-clock change.
    });
  }
}
