import { WebFixture } from '@sys/testing/web';
import { describe, expect, it } from '../../-test.ts';
import { Port } from '../mod.ts';

describe('Net.Port selection bounds and refusal', () => {
  it('malformed preference → RangeError before any network effect', () => {
    let calls = 0;
    using _fixture = mockListen(() => {
      calls++;
      throw new Deno.errors.NotSupported('Unexpected probe');
    });
    for (const pref of [-1, 0.5, 65_536, NaN, Infinity, -Infinity, null, '8080', {}]) {
      // Deliberately exercise invalid JavaScript callers at the typed boundary.
      expect(() => Port.get(pref as number)).to.throw(RangeError);
      expect(calls).to.eql(0);
    }
  });

  it('occupied 65535 → exhaustion without probing beyond the port range', () => {
    const candidates: number[] = [];
    using _fixture = mockListen(({ port }) => {
      if (port === 0) throw new Deno.errors.NotSupported('Synthetic IPv6 absence');
      candidates.push(port);
      throw new Deno.errors.AddrInUse('Occupied');
    });
    expect(() => Port.get(65_535)).to.throw('No free port found starting from 65535');
    expect(candidates).to.eql([65_535]);
  });

  it('all occupied → preference plus at most 10000 alternatives', () => {
    const candidates: number[] = [];
    using _fixture = mockListen(({ port }) => {
      if (port === 0) throw new Deno.errors.NotSupported('Synthetic IPv6 absence');
      candidates.push(port);
      throw new Deno.errors.AddrInUse('Occupied');
    });
    expect(() => Port.get(8080)).to.throw('No free port found starting from 8080');
    expect(candidates.length).to.eql(10_001);
    expect(candidates).to.eql(Array.from({ length: 10_001 }, (_, index) => 8080 + index));
  });

  it('denied candidate → original refusal without another candidate or strict conflict', () => {
    const cause = new Deno.errors.PermissionDenied('Probe refused');
    for (const strict of [false, true]) {
      const candidates: number[] = [];
      using _fixture = mockListen(({ port }) => {
        if (port === 0) throw new Deno.errors.NotSupported('Synthetic IPv6 absence');
        candidates.push(port);
        throw cause;
      });
      expect(catchCause(() => Port.get(8080, { throw: strict }))).to.equal(cause);
      expect(candidates).to.eql([8080]);
      expect(Port.inUse(8080)).to.eql(true);
    }
  });

  it('zero → listener-owned allocation without a probe', () => {
    using _fixture = mockListen(() => {
      throw new Error('Zero must not probe');
    });
    expect(Port.get(0)).to.eql(0);
    expect(Port.get(0, { throw: true })).to.eql(0);
  });
});

Deno.test({
  name: 'Net.Port actual network refusal → NotCapable, not search exhaustion',
  permissions: { net: false },
  fn() {
    expect(() => Port.get(8080)).to.throw(Deno.errors.NotCapable);
    expect(Port.inUse(8080)).to.eql(true);
    expect(Port.get(0)).to.eql(0);
  },
});

/** Exact descriptor restoration keeps each deterministic probe fixture isolated. */
function mockListen(listen: (options: Deno.ListenOptions & { port: number }) => never) {
  return WebFixture.Property.mock([{
    target: Deno,
    key: 'listen',
    descriptor: { value: listen },
  }]);
}

function catchCause(fn: () => unknown): unknown {
  try {
    fn();
  } catch (cause) {
    return cause;
  }
}
