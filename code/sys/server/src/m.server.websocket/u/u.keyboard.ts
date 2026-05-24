import { Cli, type t } from '../common.ts';

/** Bind terminal keyboard quit controls to a hosted WebSocket server. */
export function bindKeyboard(
  server: t.WebSocketServer.Started,
  input: t.WebSocketServer.Keyboard.Input | undefined,
): boolean {
  if (!input) return false;
  const options = input === true ? {} : input;

  return Cli.Keyboard.bind({
    exit: options.exit,
    until: server.finished,
    onQuit: async () => void await server.close('keyboard'),
    onError(error) {
      if (!server.disposed) console.warn(error);
    },
  }) !== undefined;
}
