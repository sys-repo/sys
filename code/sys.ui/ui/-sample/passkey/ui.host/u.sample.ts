import { AccountRuntime } from '../m.AccountRuntime/mod.ts';
import type { t } from '../common.ts';
import { browserOrigin, rp } from '../u/u.issuer.ts';
import { ROUTE } from '../u/u.routes.ts';

const binding: t.AccountRuntime.Options = {
  endpoint: new URL(ROUTE.ACCOUNT.commandPath, browserOrigin).href,
  namespace: 'accounts',
  rpId: rp.id,
  policy: { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 },
};

/** Attach once per specimen context, outside React's subscription lifetime. */
export function openSample() {
  const runtime = AccountRuntime.create(binding);
  const page = globalThis.window;
  let lifetime = 0;
  page?.addEventListener('pagehide', depart);
  page?.addEventListener('pageshow', restore);
  runtime.start();

  return {
    current: () => runtime.state.current,
    subscribe(notify: () => void) {
      const sub = runtime.state.changes$.subscribe(notify);
      return () => sub.unsubscribe();
    },
    run,
    dispose() {
      page?.removeEventListener('pagehide', depart);
      page?.removeEventListener('pageshow', restore);
      runtime.dispose();
    },
  };

  function depart() {
    lifetime++;
    runtime.depart();
  }

  function restore(event: PageTransitionEvent) {
    if (event.persisted) runtime.start();
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
