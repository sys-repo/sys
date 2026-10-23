import { describe, expect, it, type t } from '../../-test.ts';
import { localOrigin, localWebSocketUrl, normalizePath } from '../u/u.origin.ts';

describe('WebSocketServer/origin', () => {
  it('normalizes accepted route paths', () => {
    expect(normalizePath()).to.eql('/');
    expect(normalizePath('/')).to.eql('/');
    expect(normalizePath('rpc' as t.StringUrlRoute)).to.eql('/rpc');
    expect(normalizePath('/rpc/' as t.StringUrlRoute)).to.eql('/rpc');
  });

  it('builds local origins for wildcard and IPv6 hosts', () => {
    const port = 1234 as t.PortNumber;

    expect(localOrigin({ hostname: '0.0.0.0' as t.StringHostname, port })).to.eql(
      'http://127.0.0.1:1234',
    );
    expect(localOrigin({ hostname: '::' as t.StringHostname, port })).to.eql(
      'http://[::1]:1234',
    );
    expect(localOrigin({ hostname: '::1' as t.StringHostname, port })).to.eql(
      'http://[::1]:1234',
    );
  });

  it('builds WebSocket URLs for the accepted path', () => {
    const url = localWebSocketUrl({
      origin: 'http://127.0.0.1:1234' as t.StringUrl,
      path: 'rpc' as t.StringUrlRoute,
    });

    expect(url).to.eql('ws://127.0.0.1:1234/rpc');
  });
});
