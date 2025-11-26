import { type t, Cmd, CrdtCmd, CrdtIs, Is, Try } from './common.ts';

/**
 * Publish the repo's command set over a WebSocket endpoint.
 *
 * Listens on the given TCP port and upgrades WebSocket connections to a
 * typed CRDT command channel backed by the provided repo.
 */
export function publishCommands(args: { repo: t.Crdt.Repo } & t.CrdtWorkerFsPublishConfig) {
  const { repo, port, hostname = '127.0.0.1' } = args;

  if (CrdtIs.proxy(repo)) {
    throw new Error(`Should not publish commands from a proxy repo`);
  }
  if (Is.browser()) {
    throw new Error(`Cannot publish commands over websockets from the browser`);
  }

  Deno.serve(
    {
      hostname,
      port,
      onListen() {
        // keep silent: override Deno's default "Listening on ..." log
      },
    },
    (req) => {
      const upgrade = req.headers.get('upgrade');
      const isWebSocket = Is.string(upgrade) && upgrade.toLowerCase() === 'websocket';
      if (!isWebSocket) {
        return new Response(`CRDT repo command endpoint (WebSocket only)`, { status: 400 });
      }

      const { socket, response } = Deno.upgradeWebSocket(req);

      try {
        // Adapt WebSocket → CmdEndpoint and attach CRDT command handlers.
        const endpoint = Cmd.Transport.fromWebSocket(socket);
        CrdtCmd.attachHost(repo, endpoint);
      } catch (error) {
        // RFC 6455: 1011 = internal error
        Try.run(() => socket.close(1011, 'Internal error')); // ignore secondary close failures
        throw error;
      }

      return response;
    },
  );
}
