import { type t, c } from '../../-test.ts';
export * from '../common.ts';
export { Crdt } from '../../-exports/-fs/mod.ts';

type H = (event: MessageEvent) => void;

/**
 * Test utilities shared across CRDT command RPC tests.
 */
export const Fixture = {
  /**
   * Wrap a MessagePort in a CmdEndpoint shape for tests.
   *
   * The endpoint forwards `postMessage` and `message` events directly
   * to the underlying port.
   */
  makeEndpoint(port: MessagePort): t.CmdEndpoint {
    return {
      postMessage: (data: unknown) => port.postMessage(data),
      addEventListener: (type: 'message', handler: H) => port.addEventListener(type, handler),
      removeEventListener: (type: 'message', handler: H) => port.removeEventListener(type, handler),
      start: port.start?.bind(port),
      close: port.close.bind(port),
    };
  },

  /**
   * Same as makeEndpoint, but invokes a hook when `close()` is called.
   * Useful for asserting endpoint shutdown as part of repo teardown.
   */
  makeEndpointWithCloseHook(
    port: MessagePort,
    onClose: () => void,
    debug?: boolean,
  ): t.CmdEndpoint {
    return {
      postMessage: (data: unknown) => port.postMessage(data),
      addEventListener: (type: 'message', handler: H) => port.addEventListener(type, handler),
      removeEventListener: (type: 'message', handler: H) => port.removeEventListener(type, handler),
      start: port.start?.bind(port),
      close() {
        if (debug) {
          console.info();
          console.info(`${c.magenta('[Fixture]')} endpoint.close()`);
          console.info(c.yellow(String(new Error().stack)));
          console.info();
        }
        onClose();
        port.close();
      },
    };
  },
} as const;
