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
