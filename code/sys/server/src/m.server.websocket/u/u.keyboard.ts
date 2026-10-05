import { Cli, Process, type t } from '../common.ts';
import { serviceOpenUrl } from './u.status.ts';

export type KeyboardDependencies = Readonly<{
  bind: typeof Cli.Keyboard.bind;
  sh: typeof Process.sh;
  exit: typeof Deno.exit;
}>;

const DEFAULT_DEPENDENCIES: KeyboardDependencies = Object.freeze({
  bind: Cli.Keyboard.bind,
  sh: Process.sh,
  exit: Deno.exit,
});

/** Bind terminal keyboard quit controls to a hosted WebSocket server. */
export function bindKeyboard(
  server: t.WebSocketServer.Started,
  input: t.WebSocketServer.Keyboard.Input | undefined,
) {
  return bindKeyboardWith(DEFAULT_DEPENDENCIES, server, input);
}

/** Internal deterministic keyboard dependency seam. */
export function bindKeyboardWith(
  deps: KeyboardDependencies,
  server: t.WebSocketServer.Started,
  input: t.WebSocketServer.Keyboard.Input | undefined,
) {
  if (!input) return;
  const options = input === true ? {} : input;
  const shouldExit = options.exit ?? false;
  const sh = deps.sh();

  return deps.bind({
    // Server close waits for `finished`; own exit here so `onQuit` can return first.
    exit: false,
    until: server.finished,
    onQuit() {
      const close = async () => void await server.close('keyboard');
      const closing = close();
      const completion = shouldExit
        ? closing.then(
          () => deps.exit(0),
          () => undefined,
        )
        : closing;
      void completion.catch(() => undefined);
    },
    onKey(e) {
      if (e.key !== 'o') return;
      const url = serviceOpenUrl(server.status());
      if (url) sh.run(`open ${url}`);
    },
    onError(error) {
      if (!server.disposed) console.warn(error);
    },
  });
}
