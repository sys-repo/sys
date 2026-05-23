import { Schedule } from '../common.ts';

/**
 * Fake WebSocket class used to replace `globalThis.WebSocket` in tests.
 *
 * This is a known and intentional canon exception: the Web Standards API is
 * constructor/class-shaped, so this test double must also be class-shaped to
 * stand in for `globalThis.WebSocket` correctly.
 */
export class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string | URL) {
    super();
    this.url = String(url);
    Schedule.micro(() => {
      this.readyState = FakeWebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    });
  }

  send(_data: unknown) {
    return undefined;
  }

  close() {
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
