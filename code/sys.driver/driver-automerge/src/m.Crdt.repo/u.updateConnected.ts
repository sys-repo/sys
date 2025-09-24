import { type t, rx } from './common.ts';

type N = t.NetworkAdapterInterface;
let netFlight: Promise<unknown> = Promise.resolve();

/**
 * Safely connects/disconnects to each network adapter.
 */
export function updateConnected(
  adapters: t.NetworkAdapterInterface[],
  peer: t.StringId,
  enabled: boolean,
) {
  const life = rx.lifecycle();

  enqueue(async () => {
    // Hop once to avoid running on anyone else's call stack:
    await hop();

    for (const a of adapters) {
      await whenReady(a);
      if (life.disposed) return;

      if (enabled) {
        await connectAdapter(a, peer as t.PeerId);
      } else {
        await disconnectAdapter(a);
      }
    }
  });

  return life;
}

/**
 * Helpers:
 */
const hop = () => Promise.resolve();
const whenReady = async (a: N) => safe(() => a.whenReady());
const connectAdapter = (a: N, peer: t.PeerId) => safe(() => a.connect(peer, {}));
const disconnectAdapter = (a: N) => safe(() => a.disconnect?.());

/**
 * Enqueue a task to run after the current flight finishes.
 * Swallows errors to keep the chain alive.
 */
function enqueue(task: () => Promise<void>) {
  netFlight = netFlight.then(task).catch(() => {});
  return netFlight;
}

/**
 * Run a thunk, swallowing any error (used for "benign" adapter races).
 */
async function safe(thunk: () => void | Promise<void>) {
  try {
    await thunk();
  } catch {
    /* ignore */
  }
}
