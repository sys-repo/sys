import { Schedule } from './common.ts';

/**
 * Minimal WebSocket test double with URL/state observation and microtask open/close events.
 *
 * This is a known and intentional canon exception: the Web Standards API is class-shaped, so its
 * global test double must also be class-shaped. Messages, protocols, and `CloseEvent` metadata are
 * intentionally outside this fixture.
 */
export class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;

  constructor(url: string | URL) {
    super();
    this.url = String(url);
    Schedule.micro(() => {
      if (this.readyState !== FakeWebSocket.CONNECTING) return;
      this.readyState = FakeWebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    });
  }

  send(_data: unknown): void {
    return undefined;
  }

  close(): void {
    if (
      this.readyState === FakeWebSocket.CLOSING ||
      this.readyState === FakeWebSocket.CLOSED
    ) {
      return;
    }

    this.readyState = FakeWebSocket.CLOSING;
    Schedule.micro(() => {
      this.readyState = FakeWebSocket.CLOSED;
      this.dispatchEvent(new Event('close'));
    });
  }
}
