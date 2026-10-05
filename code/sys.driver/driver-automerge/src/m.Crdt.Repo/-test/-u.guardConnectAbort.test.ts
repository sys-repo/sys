import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { AutomergeRepo, describe, expect, it } from '../../-test.ts';
import { guardConnectAbort } from '../u.guardConnectAbort.ts';
import { silentShutdown } from '../u.shutdown.ts';

type Socket = NonNullable<WebSocketClientAdapter['socket']>;
type Listener = (event: Event | { error: unknown }) => void;

const abortMessage = 'WebSocket was closed before the connection was established';

describe('CrdtRepo: guardConnectAbort', () => {
  it('owns one handshake abort and releases listeners on close', () => {
    const fx = fixture();
    guardConnectAbort(fx.adapter);
    expect(fx.count('error')).to.eql(1);
    expect(fx.count('close')).to.eql(1);

    fx.emit('error', { error: new Error(abortMessage) });
    expect(fx.count('error')).to.eql(0);
    fx.emit('close', new Event('close'));
    expect(fx.count('close')).to.eql(0);
  });

  it('owns an already-queued handshake abort while CLOSING', () => {
    const fx = fixture(2);
    guardConnectAbort(fx.adapter);
    expect(fx.count('error')).to.eql(1);
    fx.emit('error', { error: new Error(abortMessage) });
    fx.emit('close', new Event('close'));
    expect(fx.count('error')).to.eql(0);
    expect(fx.count('close')).to.eql(0);
  });

  it('close without error releases the pending error listener', () => {
    const fx = fixture();
    guardConnectAbort(fx.adapter);
    fx.emit('close', new Event('close'));
    expect(fx.count('error')).to.eql(0);
    expect(fx.count('close')).to.eql(0);
  });

  it('supports browser error events without Node once()', () => {
    const fx = fixture();
    guardConnectAbort(fx.adapter);
    fx.emit('error', new Event('error'));
    fx.emit('close', new Event('close'));
    expect(fx.count('error')).to.eql(0);
    expect(fx.count('close')).to.eql(0);
  });

  it('does not swallow unrelated socket errors', () => {
    const fx = fixture();
    const failure = new Error('unexpected transport failure');
    guardConnectAbort(fx.adapter);
    expect(() => fx.emit('error', { error: failure })).to.throw(failure);
    // ws stops before emitClose when a listener throws; do not simulate a later close here.
    expect(fx.count('error')).to.eql(0);
    expect(fx.count('close')).to.eql(0);
  });

  it('leaves absent, OPEN, and CLOSED sockets alone', () => {
    guardConnectAbort(new WebSocketClientAdapter('ws://localhost'));
    for (const state of [1, 3]) {
      const fx = fixture(state);
      guardConnectAbort(fx.adapter);
      expect(fx.count('error')).to.eql(0);
      expect(fx.count('close')).to.eql(0);
    }
  });
});

describe('CrdtRepo: silentShutdown socket policy', () => {
  it('retains one-error suppression in every socket state', async () => {
    for (const state of [0, 1, 2, 3]) {
      const fx = fixture(state);
      const repo = new AutomergeRepo();
      repo.networkSubsystem.adapters.push(fx.adapter);
      let listenersAtDisconnect = 0;
      fx.adapter.disconnect = () => {
        listenersAtDisconnect = fx.count('error');
        fx.emit('error', { error: new Error('unrelated shutdown error') });
        fx.emit('close', new Event('close'));
      };

      await silentShutdown(repo);
      expect(listenersAtDisconnect).to.eql(1);
      expect(fx.count('error')).to.eql(0);
      expect(fx.count('close')).to.eql(0);
    }
  });

  it('releases an unused error listener when close arrives later', async () => {
    const fx = fixture(1);
    const repo = new AutomergeRepo();
    repo.networkSubsystem.adapters.push(fx.adapter);
    fx.adapter.disconnect = () => {};

    await silentShutdown(repo);
    expect(fx.count('error')).to.eql(1);
    fx.emit('close', new Event('close'));
    expect(fx.count('error')).to.eql(0);
    expect(fx.count('close')).to.eql(0);
  });
});

/** Browser-shaped socket double: only event registration and readyState cross this interop seam. */
function fixture(readyState = 0) {
  const listeners = new Map<string, Map<Listener, boolean>>();
  const adapter = new WebSocketClientAdapter('ws://localhost');
  const socket = {
    CONNECTING: 0,
    CLOSING: 2,
    readyState,
    addEventListener(type: string, listener: Listener, options?: { once?: boolean }) {
      let bucket = listeners.get(type);
      if (!bucket) {
        bucket = new Map();
        listeners.set(type, bucket);
      }
      bucket.set(listener, options?.once ?? false);
    },
    removeEventListener(type: string, listener: Listener) {
      listeners.get(type)?.delete(listener);
    },
  };
  // The real adapter supplies identity; no transport is acquired by this event-only fixture.
  adapter.socket = socket as unknown as Socket;
  return {
    adapter,
    count: (type: string) => listeners.get(type)?.size ?? 0,
    emit(type: string, event: Event | { error: unknown }) {
      const bucket = listeners.get(type);
      for (const [listener, once] of [...(bucket ?? [])]) {
        if (once) bucket?.delete(listener);
        listener(event);
      }
    },
  };
}
