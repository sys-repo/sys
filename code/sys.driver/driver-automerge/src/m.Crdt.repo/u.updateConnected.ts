import { type t, rx, Time } from './common.ts';

type N = t.NetworkAdapterInterface;
type WithDisconnect = { disconnect?: () => void };

let netFlight: Promise<void> = Promise.resolve();

/**
 * Safely connects/disconnects to each network adapter.
 */
export function updateConnected(adapters: readonly N[], peer: t.StringId, enabled: boolean) {
  const life = rx.lifecycle();
  const schedule = Time.scheduler(life, 'micro');
  const peerId = peer as t.PeerId;
  const list = [...adapters]; // Snapshot to avoid mutation surprises.

  enqueue(async () => {
    await schedule(); // hop off caller's stack

    for (const a of list) {
      await whenReady(a);
      if (life.disposed) return;

      if (enabled) {
        await connectAdapter(a, peerId);
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
const whenReady = (a: N) => safe(() => a.whenReady());
const connectAdapter = (a: N, peer: t.PeerId) => safe(() => a.connect(peer, {}));
const disconnectAdapter = (a: N) => safe(() => (a as WithDisconnect).disconnect?.());

/**
 * Enqueue a task to run after the current flight finishes.
 * Swallows errors to keep the chain alive.
 */
const enqueue = (task: () => Promise<void>) => {
  netFlight = netFlight.then(task).catch(() => {});
  return netFlight;
};

/**
 * Run a thunk, swallowing any error (used for "benign" adapter races).
 */
const safe = async (thunk: () => void | Promise<void>) => {
  try {
    await thunk();
  } catch {
    /* ignore */
  }
};
