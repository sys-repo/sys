import { HttpCmd } from '@sys/http/cmd';
import { Echo, type Name, type Payload, Receipt, type Result } from './u.fixture.ts';

const client = HttpCmd.client<Name, Payload, Result>({
  url: new URL(Echo.path, location.origin).href,
  ns: Echo.ns,
  policy: Echo.policy,
});
try {
  const { text, receipt } = await client.send(Echo.name, { text: Echo.text });
  if (text !== Echo.text) throw new Error('Browser did not receive the expected echo.');

  // Report only after HttpCmd accepted the correlated reply and we checked its payload.
  const observed = await fetch(Receipt.path, {
    method: 'POST',
    headers: { [Receipt.header]: receipt },
  });
  if (!observed.ok) throw new Error('Browser echo observation was rejected.');
} finally {
  client.dispose();
}
