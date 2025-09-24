import { describe, expect, it, Testing } from '../../-test.ts';
import { R } from './common.ts';
import { Net, Port } from './mod.ts';

describe('Net', { sanitizeOps: false, sanitizeResources: false }, () => {
  it('API', () => {
    expect(Net.Port).to.equal(Port);
    expect(Net.port).to.equal(Port.get);
  });

  describe('Net.Port', () => {
    // Environment feature flags (evaluated once):
    const HAS_IPV6 = (() => {
      try {
        const l = Deno.listen({ hostname: '::', port: 0 });
        l.close();
        return true;
      } catch {
        return false;
      }
    })();

    // If binding a privileged port fails, we expect conservative "inUse === true".
    const EXPECT_INUSE_ON_PRIVILEGED = (() => {
      try {
        const l = Deno.listen({ port: 1 });
        l.close();
        return false;
      } catch {
        return true;
      } // PermissionDenied or AddrInUse → we expect inUse === true
    })();

    describe('Port.random', () => {
      it('Port.random()', async () => {
        await Testing.retry(10, () => {
          const ports = [...Array(50)].map(() => Port.random());
          expect(R.equals(R.uniq(ports), ports)).to.eql(true);
          expect(ports.every((v) => typeof v === 'number')).to.eql(true);
        });
      });
    });

    describe('Port.inUse', () => {
      it('false on freshly random ports (both stacks clear)', async () => {
        await Testing.retry(3, () => {
          const ports = [...Array(10)].map(() => Port.random());
          expect(ports.every((p) => !Port.inUse(p))).to.eql(true);
        });
      });

      it('true when bound on IPv4 (default any-address)', async () => {
        await Testing.retry(3, () => {
          const port = Port.random();
          const listener = Deno.listen({ hostname: '0.0.0.0', port });
          expect(Port.inUse(port)).to.eql(true);
          listener.close();
        });
      });

      (HAS_IPV6 ? it : it.skip)('true when occupied on IPv6', () => {
        const port = Port.random();
        const l6 = Deno.listen({ hostname: '::1', port }); // IPv6 loopback only
        try {
          expect(Port.inUse(port)).to.eql(true);
        } finally {
          l6.close();
        }
      });

      (EXPECT_INUSE_ON_PRIVILEGED ? it : it.skip)(
        'conservative on privileged/denied ports (treated as in use)',
        () => {
          // Port 1 is typically PermissionDenied (non-root) or already in use; either way we expect "true".
          expect(Port.inUse(1 as number)).to.eql(true);
        },
      );
    });

    describe('Port.get', () => {
      it('returns preference port (not in use)', () => {
        const pref = Port.random();
        const res = Port.get(pref);
        expect(res).to.eql(pref);
      });

      it('increments over consecutive IPv4-occupied ports', async () => {
        await Testing.retry(3, () => {
          const a = Port.random();
          const b = a + 1;
          const l1 = Deno.listen({ hostname: '0.0.0.0', port: a });
          const l2 = Deno.listen({ hostname: '0.0.0.0', port: b });

          const res = Port.get(a);

          l1.close();
          l2.close();

          expect(res).to.eql(a + 2);
        });
      });

      (HAS_IPV6 ? it : it.skip)('increments when IPv6 holds the next ports', () => {
        const a = Port.random();
        const l6a = Deno.listen({ hostname: '::1', port: a });
        const l6b = Deno.listen({ hostname: '::1', port: a + 1 });
        try {
          const res = Port.get(a);
          expect(res).to.eql(a + 2);
        } finally {
          l6a.close();
          l6b.close();
        }
      });

      it('throws when preferred port is taken and {throw:true}', () => {
        const port = Port.random();
        const listener = Deno.listen({ hostname: '0.0.0.0', port });
        const fn = () => Port.get(port, { throw: true });
        expect(fn).to.throw(`Port already in use: ${port}`);
        listener.close();
      });

      it('no preference → returns random unused port', () => {
        const res = Port.get();
        expect(res).to.not.eql(0);
        expect(typeof res).to.eql('number');
        expect(Port.inUse(res)).to.eql(false);
      });
    });
  });

  describe('Net.connect', () => {
    it('connects to a listening port', async () => {
      await Testing.retry(3, async () => {
        const port = Port.random();
        const listener = Deno.listen({ port });

        const res = await Net.connect(port, { attempts: 3 });
        expect(res.error).to.eql(undefined);
        expect(res.socket).to.not.eql(undefined);

        const socket = res.socket!;
        expect(socket.remoteAddr.port).to.eql(port);

        socket.close();
        listener.close();
      });
    });

    it('returns an error when the port is unreachable', async () => {
      await Testing.retry(3, async () => {
        const port = Port.random();
        const res = await Net.connect(port, { attempts: 2, delay: 10 });

        expect(res.socket).to.eql(undefined);
        expect(res.error?.name).to.eql('ConnectionRefused');
        expect(res.error?.message).to.include('Connection refused');
      });
    });
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
