import { createWith } from '../u/u.createWith.ts';
import { verifier } from '../u/u.verifier.ts';
import type { t } from './common.ts';

export { authenticator } from './u.fixture.authenticator.ts';
export { registrationData, registrationPublicKey } from './u.fixture.registration.ts';

export const config = (): t.AccountService.CreateOptions => ({
  rp: { id: 'example.test', name: 'Reference accounts' },
  origins: ['https://accounts.example.test'],
  algorithms: [-257],
  lifetimes: { challenge: 60_000, session: 300_000 },
  capacity: { accounts: 10, credentials: 20, transactions: 20, sessions: 20 },
});

/** Explicit local clock and real verifier by default; no listener, browser, or real passkey. */
export function fixture(options = config(), overrides: Partial<t.ServiceDeps> = {}) {
  const clock = { now: 1_800_000_000_000 };
  const service = createWith(options, { now: () => clock.now, verifier, ...overrides });
  return {
    service,
    clock,
    async call<N extends t.Accounts.Name>(
      name: N,
      payload: t.Accounts.Payload[N],
      credential?: string,
    ) {
      return await service.handlers({ credential })[name](payload, {
        id: 'req-fixture',
        name,
        signal: new AbortController().signal,
        emit() {},
      });
    },
    dispose: () => service.dispose(),
    [Symbol.dispose]: () => service.dispose(),
  };
}

export function value<V>(
  reply: { kind: 'accepted'; value: V } | { kind: 'rejected'; code: string },
): V {
  if (reply.kind !== 'accepted') throw new Error(`Expected acceptance, got ${reply.code}`);
  return reply.value;
}
