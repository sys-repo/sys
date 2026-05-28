import { Cli, Process, type t } from '../common.ts';
import { serviceOpenUrl } from './u.status.ts';

/** Bind terminal keyboard quit controls to a hosted WebSocket server. */
export function bindKeyboard(
  server: t.WebSocketServer.Started,
  input: t.WebSocketServer.Keyboard.Input | undefined,
): boolean {
  if (!input) return false;
  const options = input === true ? {} : input;

  const sh = Process.sh();
  return Cli.Keyboard.bind({
    exit: options.exit,
    until: server.finished,
    onQuit: async () => void await server.close('keyboard'),
    onKey(e) {
      if (e.key !== 'o') return;
      const url = serviceOpenUrl(server.status());
      if (url) sh.run(`open ${url}`);
    },
    onError(error) {
      if (!server.disposed) console.warn(error);
    },
  }) !== undefined;
}
