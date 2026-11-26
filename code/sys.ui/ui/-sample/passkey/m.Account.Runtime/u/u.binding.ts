import { HttpCmd } from '@sys/http/cmd';
import { Accounts } from '../../m.Accounts/mod.ts';
import { Is, Obj, Rx, type t, Try } from '../common.ts';

/** Private binding: requests carry only the captured issuer's bearer; results are shape-checked. */
export function bind(options: t.AccountRuntime.CreateOptions) {
  const { endpoint, namespace: ns, policy, rpId } = options;
  if (!Is.str(rpId) || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/.test(rpId)) {
    throw new TypeError('Invalid account relying party ID.');
  }
  if (!Is.urlString(endpoint) || !Is.str(ns) || !ns.trim()) {
    throw new TypeError('Invalid account service binding.');
  }
  const url = new URL(endpoint);
  if (
    url.username || url.password || endpoint.includes('?') || endpoint.includes('#') ||
    (url.protocol !== 'https:' && !Is.localhost(endpoint))
  ) throw new TypeError('Invalid account service binding.');

  const client = HttpCmd.client<t.Accounts.Name, t.Accounts.Payload, t.Accounts.Result>({
    url: url.href,
    ns,
    policy,
  });
  const changed$ = Rx.subject<void>();
  let current: t.AccountRuntime.ServiceAvailability = 'unknown';
  let issued = 0;
  let latest = 0;
  const notifyAvailability = () => changed$.next();
  const availability: t.AccountRuntime.Info['availability'] = Object.freeze({
    current: () => current,
    subscribe(notify: () => void) {
      const sub = changed$.subscribe(notify);
      return () => sub.unsubscribe();
    },
  });

  const send: t.Send = async (name, input, signal, bearer) => {
    const payload = Accounts.readPayload(name, input);
    if (!payload) return { kind: 'not-submitted', reason: 'invalid-input' };

    const headers = bearer === undefined ? undefined : { Authorization: `Bearer ${bearer}` };
    const exchange = ++issued;
    const observe = (value: t.AccountRuntime.ServiceAvailability) => {
      if (signal.aborted || exchange < latest) return;
      latest = exchange;
      if (setAvailability(value)) notifyAvailability();
    };
    const { result } = await Try.run(() => client.send(name, payload, { headers, signal }));
    if (!result.ok) {
      // HttpCmd is the trusted owner of dispatch knowledge; no raw fetch error reaches here.
      if (!Obj.hasOwn(result.error, 'dispatch') || result.error.dispatch !== 'not-dispatched') {
        observe('unavailable');
        return { kind: 'indeterminate' };
      }
      return { kind: 'not-submitted', reason: signal.aborted ? 'cancelled' : 'unavailable' };
    }
    const reply = Accounts.readResult(name, result.data);
    observe(reply ? 'available' : 'unavailable'); // A valid refusal still proves communication.
    return reply ?? { kind: 'indeterminate' };
  };
  return {
    rpId,
    send,
    availability,
    resetAvailability() {
      latest = ++issued; // Ignore unsettled exchanges from the previous lifetime.
      // Let the runtime finish retiring its state before notifying either store's observers.
      return setAvailability('unknown') ? notifyAvailability : undefined;
    },
    dispose() {
      client.dispose();
      changed$.complete();
    },
  };

  function setAvailability(value: t.AccountRuntime.ServiceAvailability) {
    if (current === value) return false;
    current = value;
    return true;
  }
}
