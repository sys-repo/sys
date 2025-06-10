/**
 * @module
 * Tools for working with CRDT sync servers.
 */
import { type t, Cli, Crdt, NodeWSServerAdapter, WebSocketServer, c, pkg } from './common.ts';

/**
 * Tools for working with CRDT sync servers:
 */
export const CrdtServer: t.CrdtServerLib = {
  async start(options = {}) {
    const { port, dir, sharePolicy, denylist, keepAliveInterval } = options;

    const wss = new WebSocketServer({ port });
    const network = new NodeWSServerAdapter(wss as any, keepAliveInterval); // NB: any → type-hack.
    Crdt.repo({ dir, network, sharePolicy, denylist });

    /**
     * Print status:
     */
    const table = Cli.table([]);
    const module = c.gray(`${c.bold(c.white(pkg.name))}/${c.green('wss')} ${pkg.version}`);
    const url1 = c.cyan(`http://localhost:${c.bold(String(port))}`);
    const url2 = c.cyan(`  ws://localhost:${c.bold(String(port))}`);
    table.push([c.gray('Module:'), module]);
    table.push([c.gray('Endpoint:'), url1]);
    table.push(['', url2]);

    console.info();
    console.info(table.toString().trim());
    console.info();

    network.on('peer-candidate', (e) => {
      console.info(c.white('connected:   '), c.green(e.peerId));
    });

    network.on('peer-disconnected', (e) => {
      console.info(c.gray(c.dim('disconnected:')), c.gray(e.peerId));
    });
  },
};
