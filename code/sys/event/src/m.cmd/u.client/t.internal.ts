export type * from '../../common/t.ts';

/** Terminal outcome shared by the client and its iterator adapter. */
export type StreamTerminal =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: unknown };

/** Observer of a stream's terminal outcome. */
export type StreamTerminalHandler = (terminal: StreamTerminal) => void;
