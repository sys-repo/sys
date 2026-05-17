import { Cmd, describe, expect, it, Net } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/Cmd transport', () => {
  it('runs a typed Cmd roundtrip over WebSocket', async () => {
    type Name = 'math:add';
    type Payload = { 'math:add': { left: number; right: number } };
    type Result = { 'math:add': { total: number } };

    const ns = 'test.roundtrip';
    const cmd = Cmd.make<Name, Payload, Result>({ ns });
    const server = WebSocketServer.create<Name, Payload, Result>({
      path: '/rpc',
      cmd: {
        ns,
        handlers: {
          'math:add': ({ left, right }) => ({ total: left + right }),
        },
      },
    });

    const ws = new WebSocket(server.url);
    const closed = Fixture.waitForClose(ws);

    try {
      await Net.waitFor(ws);
      const client = cmd.client(Cmd.Transport.fromWebSocket(ws), { timeout: 1_000 });
      try {
        const result = await client.send('math:add', { left: 20, right: 22 });
        expect(result).to.eql({ total: 42 });
        expect(Fixture.detail(server.status(), 'connections')).to.eql('1');
      } finally {
        client.dispose();
      }
    } finally {
      Fixture.closeSocket(ws);
      await closed;
      await server.close('test.cleanup');
    }
  });
});
