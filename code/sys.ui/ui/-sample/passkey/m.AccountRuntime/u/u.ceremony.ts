import { Accounts } from '../../m.Accounts/mod.ts';
import { type t, Time, Try } from '../common.ts';
import { assertionJson, getAssertion, register } from './u.browser.ts';
import { enrolled, failedBegin, granted, notSubmitted } from './u.completion.ts';

type Finish = 'account.create.finish' | 'passkey.add.finish' | 'session.signIn.finish';
type Challenge = Pick<t.Accounts.Challenge<unknown>, 'transaction' | 'expiresAt'>;
type Live = (access: t.Accounts.Grant) => boolean;

/** Coordinate browser work and wire commands; neither workflow can install a bearer. */
export function createCeremonies(rpId: string, send: t.Send, live: Live) {
  return { signIn, registration };

  async function signIn(slot: t.Pending): Promise<t.Completion> {
    const { signal } = slot;
    if (!slot.phase('begin')) return { outcome: notSubmitted('cancelled') };
    const begin = await send('session.signIn.begin', {}, signal);
    if (begin.kind !== 'accepted') return failedBegin(begin, signal);
    if (signal.aborted) return { outcome: notSubmitted('cancelled') };
    const { options } = begin.value;
    if (options.rpId !== rpId) return { outcome: notSubmitted('invalid-input') };
    const open = () => getAssertion(options, signal);
    return granted(await finish(slot, begin.value, 'session.signIn.finish', open));
  }

  async function registration(slot: t.Pending, access?: t.Accounts.Grant): Promise<t.Completion> {
    const { signal } = slot;
    if (!slot.phase('begin')) return { outcome: notSubmitted('cancelled') };
    if (access && !live(access)) return { outcome: notSubmitted('invalid-input') };
    const begin = access
      ? await send('passkey.add.begin', {}, signal, access.credential)
      : await send('account.create.begin', {}, signal);
    if (begin.kind !== 'accepted') return failedBegin(begin, signal);
    if (signal.aborted) return { outcome: notSubmitted('cancelled') };
    const { options } = begin.value;
    if (options.rp.id !== rpId) return { outcome: notSubmitted('invalid-input') };
    const open = () => register(options, signal);
    if (!access) return granted(await finish(slot, begin.value, 'account.create.finish', open));
    return enrolled(access, await finish(slot, begin.value, 'passkey.add.finish', open, access));
  }

  async function finish<N extends Finish>(
    slot: t.Pending,
    challenge: Challenge,
    name: N,
    open: () => Promise<PublicKeyCredential | null>,
    access?: t.Accounts.Grant,
  ): Promise<t.Accounts.Attempt<N>> {
    const { signal } = slot;
    const valid = () => challenge.expiresAt > Time.now.timestamp && (!access || live(access));
    if (!slot.phase('ceremony')) return notSubmitted('cancelled');
    if (!valid()) return notSubmitted('invalid-input');
    const { result } = await Try.run(async () => {
      const credential = await open();
      if (signal.aborted || !credential) return;
      return name === 'session.signIn.finish' ? assertionJson(credential) : credential.toJSON();
    });
    if (signal.aborted) return notSubmitted('cancelled');
    if (!result.ok || result.data === undefined) return notSubmitted('unavailable');
    const input = { transaction: challenge.transaction, response: result.data };
    const payload = Accounts.readPayload(name, input);
    if (!payload) return notSubmitted('invalid-input');
    if (!slot.phase('finish')) return notSubmitted('cancelled');
    if (!valid()) return notSubmitted('invalid-input');
    return await send(name, payload, signal, access?.credential);
  }
}
