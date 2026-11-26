import { AccountRuntime } from '../m.Account.Runtime/mod.ts';
import type { t } from '../ui/common.ts';
import { browserOrigin, rp } from '../u/u.issuer.ts';
import { ROUTE } from '../u/u.routes.ts';
import { createServicePoll } from './u.servicePoll.ts';

const binding: t.AccountRuntime.CreateOptions = {
  endpoint: new URL(ROUTE.ACCOUNT.commandPath, browserOrigin).href,
  namespace: 'accounts',
  rpId: rp.id,
  policy: { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 },
};

export function open(options: t.Controller.OpenOptions = {}): t.Controller.Instance {
  const runtime = AccountRuntime.create(binding);
  const poll = createServicePoll(runtime.info.readCounts);
  const page = globalThis.window;
  const document = options.observeService ? page?.document : undefined;
  let lifetime = 0;
  page?.addEventListener('pagehide', depart);
  page?.addEventListener('pageshow', restore);
  document?.addEventListener('visibilitychange', syncService);
  runtime.start();
  syncService();

  return {
    current: () => runtime.state.current,
    subscribe(notify: () => void) {
      const sub = runtime.state.changed$.subscribe(notify);
      return () => sub.unsubscribe();
    },
    run,
    service: { ...poll.service, availability: runtime.info.availability },
    dispose() {
      page?.removeEventListener('pagehide', depart);
      page?.removeEventListener('pageshow', restore);
      document?.removeEventListener('visibilitychange', syncService);
      poll.dispose();
      runtime.dispose();
    },
  };

  function depart() {
    lifetime++;
    runtime.depart();
    poll.reset();
  }

  function syncService() {
    if (!document) return;
    if (document.hidden || runtime.state.current.lifecycle !== 'active') poll.pause();
    else poll.resume();
  }

  function restore(event: PageTransitionEvent) {
    if (!event.persisted) return;
    runtime.start();
    syncService();
  }

  async function run(action: t.AccountRuntime.Action) {
    const entered = lifetime;
    const outcome = await runtime.run(action);
    const { lifecycle, operation, session } = runtime.state.current;
    if (
      outcome.kind === 'indeterminate' && entered === lifetime && lifecycle === 'active' &&
      operation.kind === 'idle' && session.kind === 'unknown'
    ) await runtime.refresh(); // No retained bearer ⇒ no request. Never replay the mutation.
  }
}
