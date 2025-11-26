import { type t, Cmd, Crdt } from '../common.ts';
import { waitForOpen } from './u.waitForOpen.ts';

/**
 * Connects to the repository daemon and returns a typed command client.
 */
export async function client(port: number): Promise<t.Crdt.Cmd.Client> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  await waitForOpen(ws);

  // Wrap WebSocket → CmdEndpoint.
  const endpoint = Cmd.Transport.fromWebSocket(ws);

  // Construct the strongly-typed client.
  const cmd = Crdt.Cmd.make();
  const client = cmd.client(endpoint);
  client.dispose$.subscribe({ complete: () => endpoint.close?.() });

  // Finish up.
  return client;
}
