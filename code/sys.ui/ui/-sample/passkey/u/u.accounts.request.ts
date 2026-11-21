import { HttpCmd } from '@sys/http/cmd';
import type { HttpCmd as Transport } from '@sys/http/t';
import { Is, type t } from '../common.ts';
import { ROUTE } from './u.routes.ts';

type Options = {
  readonly origin: string;
  readonly policy: Transport.Policy;
  readonly handlers: t.Accounts.Service;
};

/** Bind exact browser admission and request-local authority to the bounded command handler. */
export function accountRequest({ origin, policy, handlers }: Options) {
  return (request: Request): Response | Promise<Response> => {
    if (new URL(request.url).pathname !== ROUTE.ACCOUNT.commandPath) return refuse(request, 404);
    if (request.method !== 'POST') return refuse(request, 405);
    if (request.headers.get('origin') !== origin) return refuse(request, 403);

    const header = request.headers.get('authorization');
    const credential = header?.match(/^Bearer +([A-Za-z0-9._~+/-]+=*)$/i)?.[1];
    if (header !== null && !Is.str(credential)) return refuse(request, 400);
    return HttpCmd.handle<t.Accounts.Name, t.Accounts.Payload, t.Accounts.Result>(request, {
      policy,
      cmd: { ns: 'accounts', handlers: handlers({ credential }) },
    });
  };
}

function refuse(request: Request, status: number) {
  // Unadmitted bodies are never read or awaited.
  void request.body?.cancel().catch(() => undefined);
  const headers = new Headers({ 'cache-control': 'no-store' });
  if (status === 405) headers.set('allow', 'POST');
  return new Response(null, { status, headers });
}
