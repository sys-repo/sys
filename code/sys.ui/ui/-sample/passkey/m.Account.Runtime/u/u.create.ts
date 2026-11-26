import type { t } from '../common.ts';
import { bind } from './u.binding.ts';
import { availability } from './u.browser.ts';
import { createCeremonies } from './u.ceremony.ts';
import { notSubmitted } from './u.completion.ts';
import { createSession } from './u.session.ts';
import { createState } from './u.state.ts';

type Action = t.AccountRuntime.Action;
type Workflow = (slot: t.Pending) => Promise<t.Completion>;
type Slot = t.Pending & { readonly abort: AbortController; retired: boolean };

const actions: readonly Action[] = ['create-account', 'sign-in', 'add-passkey', 'sign-out'];

/**
 * Capture one issuer binding and create an inactive, credential-free runtime.
 */
export function create(options: t.AccountRuntime.CreateOptions): t.AccountRuntime.Instance {
  const wire = bind(options);
  const { state, publish, complete } = createState();
  const onExpire = (last?: t.AccountRuntime.State.Snapshot['last']) =>
    publish({ session: { kind: 'signed-out' }, ...(last && { last }) });
  const session = createSession(wire.send, onExpire);
  const ceremonies = createCeremonies(wire.rpId, wire.send, session.live);
  let active: Slot | undefined;
  let lifetime = 0;

  const dispose = () => retire('disposed');
  return Object.freeze({
    state,
    info: Object.freeze({ readCounts, availability: wire.availability }),
    start,
    run,
    refresh,
    cancel: () => active?.abort.abort(),
    depart: () => retire('departed'),
    dispose,
    [Symbol.dispose]: dispose,
  });

  function start() {
    if (state.current.lifecycle === 'disposed' || state.current.lifecycle === 'active') return;
    publish({ lifecycle: 'active', browser: availability(), session: { kind: 'signed-out' } });
  }

  async function run(action: Action): Promise<t.AccountRuntime.Action.Outcome> {
    if (!actions.includes(action)) return notSubmitted('invalid-input');
    const previous = session.current;
    if (session.dropExpired()) {
      const entered = lifetime;
      // Publish expiry and the formerly eligible intent together, before notifying observers.
      const last = !active && select(action, previous)
        ? { action, outcome: notSubmitted('invalid-input') }
        : undefined;
      onExpire(last);
      if (lifetime !== entered) return notSubmitted('cancelled');
      if (last) return last.outcome;
    }
    if (state.current.lifecycle !== 'active') return notSubmitted('unavailable');
    if (active) return notSubmitted('busy');
    const access = session.current;
    const workflow = select(action, access);
    if (!workflow) return notSubmitted('invalid-input');
    if (action !== 'sign-out' && availability().kind !== 'available') {
      return notSubmitted('unavailable');
    }

    const slot = claim(action);
    let done: t.Completion | undefined;
    try {
      done = await workflow(slot);
      if (slot.retired && done.outcome.kind === 'not-submitted') return notSubmitted('cancelled');
      return done.outcome;
    } finally {
      release(slot, access, done, done && { action, outcome: done.outcome });
    }
  }

  function select(action: Action, access?: t.Accounts.Grant): Workflow | undefined {
    switch (state.current.session.kind) {
      case 'signed-out':
        if (action === 'create-account') return ceremonies.registration;
        if (action === 'sign-in') return ceremonies.signIn;
        break;
      case 'signed-in':
        if (!access) return;
        if (action === 'add-passkey') return (slot) => ceremonies.registration(slot, access);
        if (action === 'sign-out') return (slot) => session.revoke(slot, access);
    }
  }

  async function refresh() {
    if (session.dropExpired()) return onExpire();
    const access = session.current;
    if (state.current.lifecycle !== 'active' || active || !access) return;
    const slot = claim('inspect');
    let facts: t.AccountRuntime.Session | undefined;
    try {
      facts = await session.inspect(slot, access);
    } finally {
      release(slot, access, { session: facts });
    }
  }

  async function readCounts(signal = new AbortController().signal) {
    if (state.current.lifecycle !== 'active' || signal.aborted) return;
    const entered = lifetime;
    const result = await wire.send('service.stats', {}, signal);
    if (lifetime !== entered || signal.aborted) return;
    if (result.kind === 'accepted') return Object.freeze(result.value);
  }

  function claim(action: Action | 'inspect'): Slot {
    const abort = new AbortController();
    const { signal } = abort;
    active = {
      abort,
      signal,
      retired: false,
      phase(phase) {
        if (signal.aborted) return false;
        publish({ operation: { kind: 'pending', action, phase } });
        return !signal.aborted;
      },
    };
    return active;
  }

  /** Only this slot can admit a grant. Never spread a private completion into public state. */
  function release(
    slot: Slot,
    access?: t.Accounts.Grant,
    done?: Pick<t.Completion, 'grant' | 'session'>,
    last?: t.AccountRuntime.State.Snapshot['last'],
  ) {
    active = undefined;
    if (slot.retired) {
      if (state.current.lifecycle !== 'disposed') publish({ operation: { kind: 'idle' } });
      return;
    }
    let facts = done?.session ?? state.current.session;
    if (done?.grant) facts = session.adopt(done.grant);
    else if (session.dropExpired() || (access && session.current !== access)) {
      facts = { kind: 'signed-out' };
    } else if (facts.kind === 'signed-out') session.forget();
    publish({ operation: { kind: 'idle' }, session: facts, ...(last && { last }) });
  }

  function retire(lifecycle: 'departed' | 'disposed') {
    if (state.current.lifecycle === 'disposed' || state.current.lifecycle === lifecycle) return;
    lifetime++;
    const notifyAvailability = wire.resetAvailability();
    const slot = active;
    if (slot) slot.retired = true;
    session.forget();
    publish({
      lifecycle,
      session: { kind: 'unknown' },
      browser: { kind: 'unchecked' },
      operation: slot && lifecycle === 'departed' ? { kind: 'retiring' } : { kind: 'idle' },
      last: undefined,
    });
    notifyAvailability?.();
    slot?.abort.abort();
    if (lifecycle === 'disposed') {
      wire.dispose();
      complete();
    }
  }
}
