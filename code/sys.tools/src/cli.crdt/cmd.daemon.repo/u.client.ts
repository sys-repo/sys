import { type t, c, Cmd, Crdt, Net, Str } from '../common.ts';

/**
 * Connects to the repository daemon and returns a typed command client.
 *
 * If the daemon is not running (WebSocket cannot connect),
 * a structured error is thrown with a clean message.
 */
export async function client(port: number): Promise<t.Crdt.Cmd.Client> {
  const url = `ws://127.0.0.1:${port}`;
  const ws = new WebSocket(url);

  /**
   * Convert the WebSocket-level "network error" event into
   * a clean, predictable exception before awaiting open.
   */
  let networkError: Event | undefined;
  const onError = (e: Event) => (networkError = e);
  ws.addEventListener('error', onError);

  try {
    await Net.waitFor(ws);

    if (networkError) {
      // WebSocket errored *before* or *during* open.
      throw new Error(`Could not connect to repository daemon on ${url} (connection failed)`);
    }

    // Wrap WebSocket → CmdEndpoint.
    const endpoint = Cmd.Transport.fromWebSocket(ws);

    // Construct the strongly-typed client.
    const cmd = Crdt.Cmd.make();
    const client = cmd.client(endpoint);

    // Cleanup wiring.
    client.dispose$.subscribe({ complete: () => endpoint.close?.() });

    return client;
  } catch (err) {
    // Ensure we close the underlying WS if connection failed.
    try {
      ws.close();
    } catch {}
    throw err instanceof Error
      ? err
      : new Error(`Could not connect to repository daemon on ${url}`);
  } finally {
    ws.removeEventListener('error', onError);
  }
}

export async function tryClient(port: number): Promise<t.Crdt.Cmd.Client | undefined> {
  try {
    return await client(port);
  } catch (err) {
    const str = Str.builder()
      .line()
      .line(c.yellow(`  Could not connect to repository daemon on port ${c.white(String(port))}`))
      .line(c.italic(c.gray(`  Start the daemon before continuing`)))
      .line();
    console.info(String(str));
    return;
  }
}
