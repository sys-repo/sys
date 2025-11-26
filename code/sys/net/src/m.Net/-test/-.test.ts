import { describe, expect, it } from '../../-test.ts';
import { Net, Port } from '../mod.ts';

describe('Net', () => {
  it('API', () => {
    expect(Net.Port).to.equal(Port);
    expect(Net.port).to.equal(Port.get);
  });

  describe('Net.toUrl', () => {
    const A = (hostname: string, port: number): Deno.NetAddr => ({
      transport: 'tcp',
      hostname,
      port,
    });

    it('defaults to http on loopback (127.0.0.1)', () => {
      const url = Net.toUrl(A('127.0.0.1', 8080));
      expect(url).to.eql('http://127.0.0.1:8080');
    });

    it('defaults to http on loopback (localhost)', () => {
      const url = Net.toUrl(A('localhost', 3000));
      expect(url).to.eql('http://localhost:3000');
    });

    it('uses https on non-loopback host (domain)', () => {
      const url = Net.toUrl(A('example.com', 8443));
      expect(url).to.eql('https://example.com:8443');
    });

    it('uses ws on loopback when kind="ws"', () => {
      const url = Net.toUrl(A('127.0.0.1', 3030), 'ws');
      expect(url).to.eql('ws://127.0.0.1:3030');
    });

    it('uses wss on non-loopback when kind="ws"', () => {
      const url = Net.toUrl(A('my.host', 9001), 'ws');
      expect(url).to.eql('wss://my.host:9001');
    });

    it('wildcard IPv4 (0.0.0.0) maps to 127.0.0.1', () => {
      const url = Net.toUrl(A('0.0.0.0', 8080));
      expect(url).to.eql('http://127.0.0.1:8080');
    });

    it('wildcard IPv6 (::) maps to 127.0.0.1', () => {
      const url = Net.toUrl(A('::', 8080));
      expect(url).to.eql('http://127.0.0.1:8080');
    });

    it('IPv6 loopback ::1 → brackets, http', () => {
      const url = Net.toUrl(A('::1', 8080));
      expect(url).to.eql('http://[::1]:8080');
    });

    it('IPv6 public → brackets, https', () => {
      const url = Net.toUrl(A('2001:db8::1', 8080));
      expect(url).to.eql('https://[2001:db8::1]:8080');
    });

    it('elides :80 for http (loopback)', () => {
      const url = Net.toUrl(A('127.0.0.1', 80));
      expect(url).to.eql('http://127.0.0.1');
    });

    it('elides :80 for ws (loopback, kind="ws")', () => {
      const url = Net.toUrl(A('127.0.0.1', 80), 'ws');
      expect(url).to.eql('ws://127.0.0.1');
    });

    it('elides :443 for https (public)', () => {
      const url = Net.toUrl(A('example.com', 443));
      expect(url).to.eql('https://example.com');
    });

    it('elides :443 for wss (public, kind="ws")', () => {
      const url = Net.toUrl(A('example.com', 443), 'ws');
      expect(url).to.eql('wss://example.com');
    });

    it('preserves non-default ports (http/ws)', () => {
      expect(Net.toUrl(A('127.0.0.1', 81))).to.eql('http://127.0.0.1:81');
      expect(Net.toUrl(A('127.0.0.1', 81), 'ws')).to.eql('ws://127.0.0.1:81');
    });

    it('preserves non-default ports (https/wss)', () => {
      expect(Net.toUrl(A('host.tld', 444))).to.eql('https://host.tld:444');
      expect(Net.toUrl(A('host.tld', 444), 'ws')).to.eql('wss://host.tld:444');
    });
  });
});
