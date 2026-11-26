import { HttpCmd } from '@sys/http/cmd';
import { Accounts } from '../../m.Accounts/mod.ts';
import { Is, Obj, type t, Try } from '../common.ts';

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
  const send: t.Send = async (name, input, signal, bearer) => {
    const payload = Accounts.readPayload(name, input);
    if (!payload) return { kind: 'not-submitted', reason: 'invalid-input' };

    const headers = bearer === undefined ? undefined : { Authorization: `Bearer ${bearer}` };
    const { result } = await Try.run(() => client.send(name, payload, { headers, signal }));
    if (!result.ok) {
      // HttpCmd is the trusted owner of dispatch knowledge; no raw fetch error reaches here.
      if (!Obj.hasOwn(result.error, 'dispatch') || result.error.dispatch !== 'not-dispatched') {
        return { kind: 'indeterminate' };
      }
      return { kind: 'not-submitted', reason: signal.aborted ? 'cancelled' : 'unavailable' };
    }
    return Accounts.readResult(name, result.data) ?? { kind: 'indeterminate' };
  };
  return { rpId, send, dispose: () => client.dispose() };
}
