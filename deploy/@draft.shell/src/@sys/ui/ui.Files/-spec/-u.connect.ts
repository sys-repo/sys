import type { DebugSignals } from './-SPEC.Debug.tsx';
import { Err, FilesBase, type t } from './common.ts';

const ENDPOINT: t.StringUrl = 'ws://localhost:5050/files';
const TIMEOUT: t.Msecs = 3_000;

/**
 * Connect to the sample Files websocket and update the debug snapshot.
 */
export async function connect(debug: DebugSignals) {
  const p = debug.props;
  let client: t.Files.Client.WebSocket | undefined;
  p.snapshot.value = { status: 'starting' };

  try {
    client = await FilesBase.Client.websocket(ENDPOINT, { timeout: TIMEOUT });
    p.snapshot.value = {
      status: 'ready',
      capabilities: await client.capabilities(),
    };
  } catch (cause) {
    p.snapshot.value = {
      status: 'error',
      error: Err.std(cause),
    };
  } finally {
    if (client && !client.disposed) await client.close('files:info-panel debug');
  }
}
