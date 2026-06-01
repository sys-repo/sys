import type { DebugSignals } from './-SPEC.Debug.tsx';
import { D, Err, FilesBase, type t } from './-common.ts';

let active: t.Files.Client.WebSocket | undefined;

/**
 * Connect to the sample Files websocket and update the debug snapshot.
 */
export async function connect(debug: DebugSignals) {
  snapshot(debug, { status: 'starting' });

  try {
    if (active && !active.disposed) await active.close('files:info-panel reconnect');
    active = await FilesBase.Client.websocket(D.endpoint, { timeout: D.timeout });
    snapshot(debug, { status: 'ready', capabilities: await active.capabilities() });
  } catch (cause) {
    active = undefined;
    snapshot(debug, { status: 'error', error: Err.std(cause) });
  }
}

/**
 * Disconnect the active sample Files websocket.
 */
export async function disconnect(debug: DebugSignals) {
  const client = active;
  active = undefined;

  if (!client || client.disposed) {
    snapshot(debug, { status: 'stopped' });
    return;
  }

  snapshot(debug, { status: 'stopping' });

  try {
    await client.close('files:info-panel disconnect');
    snapshot(debug, { status: 'stopped' });
  } catch (cause) {
    snapshot(debug, { status: 'error', error: Err.std(cause) });
  }
}

/**
 * Helpers:
 */
function snapshot(debug: DebugSignals, value: t.FileInfoPanel.Snapshot) {
  debug.props.snapshot.value = value;
}
