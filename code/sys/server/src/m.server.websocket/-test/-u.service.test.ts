import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Cli } from '../common.ts';
import { WebSocketServer } from '../mod.ts';
import { formatStarted } from '../u/u.fmt.ts';
import { serviceOpenUrl } from '../u/u.status.ts';
import { Fixture } from './u.fixture.ts';

describe('WebSocketServer/service handle', () => {
  it('renders direct-startup URLs in owner-reported order', () => {
    const text = formatStarted({
      state: 'ready',
      kind: 'fixture:websocket',
      urls: [
        { href: 'ws://127.0.0.1:5050/files' as t.StringUrl, label: 'files:websocket' },
        { href: 'http://127.0.0.1:5050/files/manifest' as t.StringUrl, label: 'files:manifest' },
      ],
    }, { lifecycle: 'manual', keyboard: false });

    const clean = Cli.stripAnsi(text);
    const websocket = clean.indexOf('ws://localhost:5050/files');
    const manifest = clean.indexOf('http://localhost:5050/files/manifest');

    expect(websocket >= 0).to.eql(true);
    expect(manifest >= 0).to.eql(true);
    expect(websocket < manifest).to.eql(true);
  });

  it('renders direct-startup keyboard controls from hosted lifecycle options', () => {
    const status: t.Service.Status = {
      state: 'ready',
      kind: 'websocket:cmd',
      urls: [
        { href: 'ws://127.0.0.1:5050/files' as t.StringUrl },
        { href: 'http://127.0.0.1:5050/files/manifest' as t.StringUrl },
      ],
    };

    expect(formatStarted(status, { lifecycle: 'manual', keyboard: false })).to.not.contain('quit');
    expect(formatStarted(status, { lifecycle: 'manual', keyboard: false })).to.not.contain('open');
    expect(formatStarted(status, { lifecycle: 'process', keyboard: false })).to.contain('Ctrl+C');
    expect(formatStarted(status, { lifecycle: 'manual', keyboard: true })).to.contain('open');
    expect(formatStarted(status, { lifecycle: 'manual', keyboard: true })).to.contain('O');
    expect(formatStarted(status, { lifecycle: 'manual', keyboard: true })).to.contain(
      'Ctrl+C or Q',
    );
    expect(formatStarted(status, { lifecycle: 'process', keyboard: true })).to.contain(
      'Ctrl+C or Q',
    );
  });

  it('uses the HTTP sidecar URL for direct-startup open controls', () => {
    const status: t.Service.Status = {
      state: 'ready',
      kind: 'websocket:cmd',
      urls: [
        { href: 'ws://127.0.0.1:5050/files' as t.StringUrl },
        { href: 'http://127.0.0.1:5050/files/manifest' as t.StringUrl },
      ],
    };

    expect(serviceOpenUrl(status)).to.eql('http://127.0.0.1:5050/files/manifest');
  });

  it('reports the attempted address when the listen port is already in use', () => {
    const blocker = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const addr = blocker.addr as Deno.NetAddr;

    try {
      const caught = catchSync(() => {
        WebSocketServer.create({
          hostname: '127.0.0.1',
          port: addr.port as t.PortNumber,
          path: '/cmd',
          cmd: { ns: 'test.service', handlers: {} },
        });
      });
      if (!caught) throw new Error('expected address-in-use failure');
      const error = caught as Error & {
        readonly kind?: string;
        readonly address?: unknown;
        readonly cause?: unknown;
      };

      expect(error.message).to.eql(
        `WebSocketServer.create: address already in use: 127.0.0.1:${addr.port}.`,
      );
      expect(error.kind).to.eql('WebSocketServerAddressInUse');
      expect(error.address).to.eql({ hostname: '127.0.0.1', port: addr.port });
      expect(error.cause).to.be.instanceOf(Deno.errors.AddrInUse);
    } finally {
      blocker.close();
    }
  });

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

/**
 * Helpers:
 */
function catchSync(fn: () => unknown): Error | undefined {
  try {
    fn();
  } catch (cause) {
    return cause as Error;
  }
}
