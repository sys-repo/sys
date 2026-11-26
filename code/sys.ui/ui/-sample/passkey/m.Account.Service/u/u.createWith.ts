import { Accounts } from '../../m.Accounts/mod.ts';
import { Is, Obj, type t } from './common.ts';
import { createAuthority } from './u.authority.ts';
import { createBegin } from './u.begin.ts';
import { capturePolicy } from './u.policy.ts';
import { createRegister } from './u.register.ts';
import { accepted, failure, rejected, validate } from './u.reply.ts';
import { createSignIn } from './u.signIn.ts';
import { algorithms } from './u.verifier.ts';

/** Trusted owner-test seam; absent from mod.ts and the public type surface. */
export function createWith(
  options: t.AccountService.CreateOptions,
  deps: t.ServiceDeps,
): t.AccountService.Instance {
  const policy = capturePolicy(options);
  const supportedAlgorithms: ReadonlySet<number> = new Set(algorithms);
  for (const algorithm of policy.algorithms) {
    if (supportedAlgorithms.has(algorithm)) continue;
    throw new TypeError('Unsupported account service algorithm.');
  }
  const authority = createAuthority(policy, () => deps.now());
  const begin = createBegin(authority, policy);
  const register = createRegister(authority, policy, deps);
  const signIn = createSignIn(authority, policy, deps);

  function admit<N extends t.Accounts.Name>(
    name: N,
    run: (input: t.Accounts.Payload[N]) => t.Accounts.Result[N] | Promise<t.Accounts.Result[N]>,
  ) {
    return async (input: t.Accounts.Payload[N]): Promise<t.Accounts.Result[N]> => {
      try {
        if (authority.disposed) throw failure();
        authority.prune();
        const payload = Accounts.readPayload(name, input);
        if (!payload) return rejected('invalid-request');
        // Successful results are validated by their owner before publication; no fallible
        // completion work belongs here after a mutation has committed.
        return await run(Obj.clone(payload));
      } catch {
        // Exceptions stay failures, not guessed domain refusals. No input or upstream cause escapes.
        throw failure();
      }
    };
  }

  return Object.freeze({
    handlers(request: t.Accounts.Authority) {
      const candidate = request?.credential;
      const bearer = Is.str(candidate) ? candidate : undefined;
      return {
        'account.create.begin': admit('account.create.begin', () => begin('create')),
        'account.create.finish': admit(
          'account.create.finish',
          (input) => register('create', input),
        ),
        'session.signIn.begin': admit('session.signIn.begin', () => begin('signIn')),
        'session.signIn.finish': admit('session.signIn.finish', signIn),
        'passkey.add.begin': admit('passkey.add.begin', () => begin('add', bearer)),
        'passkey.add.finish': admit(
          'passkey.add.finish',
          (input) => register('add', input, bearer),
        ),
        'session.inspect': admit('session.inspect', () => {
          const session = authority.live(bearer);
          const result = accepted(session ? authority.observe(session) : null);
          validate('session.inspect', result);
          return result;
        }),
        'session.revoke': admit('session.revoke', () => {
          const result = accepted(null);
          validate('session.revoke', result);
          if (bearer) authority.current.sessions.delete(bearer);
          return result;
        }),
        'service.stats': admit('service.stats', () => {
          // Admission pruned expired sessions; no await separates the three counts.
          const { accounts, credentials, sessions } = authority.current;
          const result = accepted({
            accounts: accounts.size,
            registeredPasskeys: credentials.size,
            validSessions: sessions.size,
          });
          validate('service.stats', result);
          return result;
        }),
      };
    },
    dispose: authority.dispose,
    [Symbol.dispose]: authority.dispose,
  });
}
