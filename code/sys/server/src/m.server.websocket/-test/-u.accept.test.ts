import { describe, expect, it } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/request admission', () => {
  it('rejects wrong paths and non-upgrade requests', async () => {
    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
    });

    try {
      const wrongPath = await Fixture.rawUpgrade(server, '/wrong');
      expect(wrongPath.status).to.eql(404);

      const notUpgrade = await fetch(`${server.origin}/socket`);
      await notUpgrade.body?.cancel();
      expect(notUpgrade.status).to.eql(426);
    } finally {
      await server.close('test.cleanup');
    }
  });

  it('allows owner HTTP sidecar responses before websocket admission', async () => {
    const server = WebSocketServer.create({
      path: '/socket',
      cmd: { handlers: { ping: () => 'pong' } },
      http: {
        urls: [{ path: '/manifest', label: 'fixture:manifest' }],
        handle(request) {
          const url = new URL(request.url);
          if (url.pathname !== '/manifest') return undefined;
          return Response.json({ ok: true });
        },
      },
    });

    try {
      const manifest = await fetch(`${server.origin}/manifest`);
      expect(manifest.status).to.eql(200);
      expect(await manifest.json()).to.eql({ ok: true });
      expect(server.status().urls).to.eql([
        { href: server.url, label: 'websocket' },
        { href: `${server.origin}/manifest`, label: 'fixture:manifest' },
      ]);

      const notUpgrade = await fetch(`${server.origin}/socket`);
      await notUpgrade.body?.cancel();
      expect(notUpgrade.status).to.eql(426);
    } finally {
      await server.close('test.cleanup');
    }
  });

  it('honors custom accept rejection before upgrade', async () => {
    const server = WebSocketServer.create({
      path: '/socket',
      accept: () => false,
      cmd: { handlers: { ping: () => 'pong' } },
    });

    try {
      const rejected = await Fixture.rawUpgrade(server, '/socket');
      expect(rejected.status).to.eql(403);
    } finally {
      await server.close('test.cleanup');
    }
  });

  it('returns a custom accept response before upgrade', async () => {
    const server = WebSocketServer.create({
      path: '/socket',
      accept: () => new Response('No socket for you.', { status: 401 }),
      cmd: { handlers: { ping: () => 'pong' } },
    });

    try {
      const rejected = await Fixture.rawUpgrade(server, '/socket');
      expect(rejected.status).to.eql(401);
    } finally {
      await server.close('test.cleanup');
    }
  });
});
