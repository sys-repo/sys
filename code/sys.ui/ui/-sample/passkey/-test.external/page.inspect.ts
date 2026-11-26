import { HttpCmd } from '@sys/http/cmd';
import type { t } from '../common.ts';
import { Accounts } from '../m.Accounts/mod.ts';
import { ROUTE } from '../u/u.routes.ts';

// Consume the explicit action before sending. A Vite reload must not dispatch another command.
if (location.hash === '#inspect') {
  history.replaceState(null, '', location.pathname);
  using client = HttpCmd.client<t.Accounts.Name, t.Accounts.Payload, t.Accounts.Result>({
    url: new URL(ROUTE.ACCOUNT.commandPath, location.origin).href,
    ns: Accounts.Cmd.ns,
    policy: { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 },
  });
  const reply = await client.send('session.inspect', {});
  if (reply.kind !== 'accepted' || reply.value !== null) throw new Error('Expected no session.');
  document.forms.namedItem('receipt')!.requestSubmit();
}
