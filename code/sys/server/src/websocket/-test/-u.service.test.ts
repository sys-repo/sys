import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { WebSocketServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/service handle', () => {
  it('exposes a Cell-compatible service status', async () => {
    type Name = 'ping';
    type Payload = { ping: { count: number } };
    type Result = { ping: { count: number } };

    const server = WebSocketServer.create<Name, Payload, Result>({
      path: '/cmd',
      cmd: { ns: 'test.service', handlers: { ping: (e) => ({ count: e.count + 1 }) } },
      status: {
        name: 'Test command socket',
        kind: 'fixture:websocket',
        config: '/tmp/ws.fixture.yaml' as t.StringPath,
        details: [{ label: 'owner', value: 'contract-test' }],
      },
    });

    try {
      expectTypeOf(server.status).toMatchTypeOf<() => t.Service.Status>();
      expectTypeOf(server).toMatchTypeOf<t.Service.Handle>();

      const status = server.status();
      expect(status.state).to.eql('ready');
      expect(status.name).to.eql('Test command socket');
      expect(status.kind).to.eql('fixture:websocket');
      expect(status.config).to.eql('/tmp/ws.fixture.yaml');
      expect(status.urls).to.eql([{ href: server.url, label: 'websocket' }]);
      expect(Fixture.detail(status, 'path')).to.eql('/cmd');
      expect(Fixture.detail(status, 'namespace')).to.eql('test.service');
      expect(Fixture.detail(status, 'connections')).to.eql('0');
      expect(Fixture.detail(status, 'owner')).to.eql('contract-test');
    } finally {
      await server.close('test.cleanup');
    }

    expect(server.status().state).to.eql('stopped');
  });
});
