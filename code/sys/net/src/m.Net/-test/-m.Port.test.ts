import { describe, expect, it, R, Testing } from '../../-test.ts';
import { Port } from '../mod.ts';

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
        try {
          expect(Port.inUse(port)).to.eql(true);
        } finally {
          listener.close();
        }
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
      await Testing.retry(50, () => {
        const a = Port.random();
        const b = a + 1;
        const l1 = Deno.listen({ hostname: '0.0.0.0', port: a });
        const l2 = Deno.listen({ hostname: '0.0.0.0', port: b });
        try {
          const res = Port.get(a);
          expect(res).to.eql(a + 2);
        } finally {
          l1.close();
          l2.close();
        }
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
      try {
        const fn = () => Port.get(port, { throw: true });
        expect(fn).to.throw(`Port already in use: ${port}`);
      } finally {
        listener.close();
      }
    });

    it('no preference → returns random unused port', () => {
      const res = Port.get();
      expect(res).to.not.eql(0);
      expect(typeof res).to.eql('number');
      expect(Port.inUse(res)).to.eql(false);
    });
  });
});
