import type { t } from '../common.ts';
import type { FilesCmd } from './t.cmd.ts';

/**
 * Files client adapters.
 */
export declare namespace FilesClient {
  /** Runtime client adapter surface. */
  export type Lib = {
    /** Open a WebSocket and return a typed Files Cmd client bound to it. */
    websocket(url: t.StringUrl | URL, options?: WebSocketOptions): Promise<WebSocket>;
  };

  /** Options for `Files.Client.websocket(...)`. */
  export type WebSocketOptions = Pick<t.Cmd.Client.Options, 'timeout'> & {
    /** Optional WebSocket subprotocols passed to the platform constructor. */
    readonly protocols?: string | string[];
  };

  /** Files Cmd client backed by a WebSocket transport. */
  export type WebSocket = FilesCmd.Client & t.WaitableHandle & {
    /** Concrete URL used to open the socket. */
    readonly url: t.StringUrl;

    /** Resolves when the underlying WebSocket closes; the client lifecycle disposes with it. */
    readonly finished: Promise<CloseEvent | undefined>;

    /** Dispose the client and await WebSocket close. */
    close(reason?: unknown): Promise<void>;
  };
}
