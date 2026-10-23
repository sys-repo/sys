import { describe, expect, it } from '../../-test.ts';
import { createPort } from '../m.Port.ts';
import { createPortProbe, type PortListen } from '../u/u.probe.ts';

type Options = Parameters<PortListen>[0];
const TARGETS = ['0.0.0.0', '127.0.0.1', '::', '::1'];

describe('Net.Port probe evidence', () => {
  it('successful discovery → all targets checked, listeners closed, support cached', () => {
    const fixture = listeners();
    const port = createPort(fixture.listen);
    expect(port.get(8080)).to.eql(8080);
    expect(port.inUse(8081)).to.eql(false);
    expect(fixture.calls).to.eql([
      { hostname: '::', port: 0 },
      ...TARGETS.map((hostname) => ({ hostname, port: 8080 })),
      ...TARGETS.map((hostname) => ({ hostname, port: 8081 })),
    ]);
    expect(fixture.closed).to.eql(fixture.calls);
  });

  it('established unsupported discovery → IPv4 only, cached absence', () => {
    const fixture = listeners(({ port }) => {
      if (port === 0) throw new Deno.errors.NotSupported('Synthetic family absence');
    });
    const port = createPort(fixture.listen);
    expect(port.get(8080)).to.eql(8080);
    expect(port.get(8081)).to.eql(8081);
    expect(fixture.calls).to.eql([
      { hostname: '::', port: 0 },
      { hostname: '0.0.0.0', port: 8080 },
      { hostname: '127.0.0.1', port: 8080 },
      { hostname: '0.0.0.0', port: 8081 },
      { hostname: '127.0.0.1', port: 8081 },
    ]);
    expect(fixture.closed).to.eql(fixture.calls.slice(1));
  });

  it('denied or ambiguous discovery → refusal, never cached as unsupported', () => {
    for (const cause of refusals()) {
      let refuse = true;
      const fixture = listeners(({ port }) => {
        if (port === 0 && refuse) throw cause;
      });
      const port = createPort(fixture.listen);
      expect(catchCause(() => port.get(8080))).to.equal(cause);
      expect(port.inUse(8080)).to.eql(true);
      expect(fixture.calls).to.eql([
        { hostname: '::', port: 0 },
        { hostname: '::', port: 0 },
      ]);
      expect(fixture.closed).to.eql([]);
      refuse = false;
      expect(port.get(8080)).to.eql(8080);
      expect(fixture.calls.slice(2)).to.eql([
        { hostname: '::', port: 0 },
        ...TARGETS.map((hostname) => ({ hostname, port: 8080 })),
      ]);
      expect(fixture.closed).to.eql(fixture.calls.slice(2));
    }
  });

  it('candidate refusal after a successful target → original error and no continuing scan', () => {
    const causes = [
      ...refusals().filter((cause) => !(cause instanceof Deno.errors.AddrInUse)),
      new Deno.errors.NotSupported('Unexpected candidate support loss'),
    ];
    for (const cause of causes) {
      for (const strict of [false, true]) {
        const fixture = listeners(({ hostname, port }) => {
          if (hostname === '127.0.0.1' && port === 8080) throw cause;
        });
        const port = createPort(fixture.listen);
        expect(catchCause(() => port.get(8080, { throw: strict }))).to.equal(cause);
        expect(fixture.calls).to.eql([
          { hostname: '::', port: 0 },
          { hostname: '0.0.0.0', port: 8080 },
          { hostname: '127.0.0.1', port: 8080 },
        ]);
        expect(fixture.closed).to.eql(fixture.calls.slice(0, 2));
        expect(port.inUse(8080)).to.eql(true);
      }
    }
  });

  it('established conflicts across families → next fully checked candidate', () => {
    const fixture = listeners(({ hostname, port }) => {
      if (port === 8080 || (port === 8081 && hostname === '::1')) {
        throw new Deno.errors.AddrInUse('Occupied');
      }
    });
    const port = createPort(fixture.listen);
    expect(port.get(8080)).to.eql(8082);
    expect(fixture.calls).to.eql([
      { hostname: '::', port: 0 },
      { hostname: '0.0.0.0', port: 8080 },
      ...TARGETS.map((hostname) => ({ hostname, port: 8081 })),
      ...TARGETS.map((hostname) => ({ hostname, port: 8082 })),
    ]);
    expect(fixture.closed).to.eql([
      fixture.calls[0],
      ...fixture.calls.slice(2, 5),
      ...fixture.calls.slice(6),
    ]);
  });

  it('strict conflict → one candidate and no alternative', () => {
    const fixture = listeners(({ port }) => {
      if (port !== 0) throw new Deno.errors.AddrInUse('Occupied');
    });
    expect(() => createPort(fixture.listen).get(8080, { throw: true })).to.throw(
      'Port already in use: 8080',
    );
    expect(fixture.calls).to.eql([
      { hostname: '::', port: 0 },
      { hostname: '0.0.0.0', port: 8080 },
    ]);
    expect(fixture.closed).to.eql([fixture.calls[0]]);
  });

  it('free 65535 → selected; occupied final two ports → capped exhaustion', () => {
    const free = listeners();
    expect(createPort(free.listen).get(65_535)).to.eql(65_535);
    expect(free.calls).to.eql([
      { hostname: '::', port: 0 },
      ...TARGETS.map((hostname) => ({ hostname, port: 65_535 })),
    ]);
    expect(free.closed).to.eql(free.calls);

    const occupied = listeners(({ port }) => {
      if (port !== 0) throw new Deno.errors.AddrInUse('Occupied');
    });
    expect(() => createPort(occupied.listen).get(65_534)).to.throw(
      'No free port found starting from 65534',
    );
    expect(occupied.calls).to.eql([
      { hostname: '::', port: 0 },
      { hostname: '0.0.0.0', port: 65_534 },
      { hostname: '0.0.0.0', port: 65_535 },
    ]);
  });

  it('last budgeted alternative → selectable without an off-by-one exclusion', () => {
    const fixture = listeners(({ port }) => {
      if (port > 0 && port < 18_080) throw new Deno.errors.AddrInUse('Occupied');
    });
    expect(createPort(fixture.listen).get(8080)).to.eql(18_080);
    expect(fixture.calls.slice(1, 10_001).map(({ port }) => port)).to.eql(
      Array.from({ length: 10_000 }, (_, index) => 8080 + index),
    );
    expect(fixture.calls.slice(10_001)).to.eql(
      TARGETS.map((hostname) => ({ hostname, port: 18_080 })),
    );
    expect(fixture.closed).to.eql([fixture.calls[0], ...fixture.calls.slice(10_001)]);
  });

  it('cleanup failure → refusal, not conflict or a cached capability fact', () => {
    for (
      const cause of [new Deno.errors.AddrInUse('Close failed'), new Deno.errors.NotSupported()]
    ) {
      let closes = 0;
      const calls: Options[] = [];
      const port = createPort((options) => {
        calls.push(options);
        return {
          addr: { transport: 'tcp', hostname: options.hostname ?? '0.0.0.0', port: options.port },
          close() {
            closes++;
            if (closes === 1) throw cause;
          },
        };
      });
      expect(catchCause(() => port.get(8080))).to.equal(cause);
      expect(port.get(8080)).to.eql(8080);
      expect(calls.slice(0, 2)).to.eql([
        { hostname: '::', port: 0 },
        { hostname: '::', port: 0 },
      ]);
      expect(closes).to.eql(calls.length);
    }
  });

  it('native probe errors → distinct evidence, without name-based classification', () => {
    for (
      const [cause, kind] of [
        [new Deno.errors.AddrInUse(), 'in_use'],
        [new Deno.errors.NotSupported(), 'not_supported'],
        [new Deno.errors.PermissionDenied(), 'denied'],
        [new Deno.errors.NotCapable(), 'denied'],
        [new Deno.errors.AddrNotAvailable(), 'unavailable'],
        [{ name: 'AddrInUse' }, 'other'],
      ] as const
    ) {
      const probes = createPortProbe(() => {
        throw cause;
      });
      expect(probes.probe('127.0.0.1', 8080)).to.eql({ kind, err: cause });
    }
  });

  it('successful random allocation and selection → real ports remain reusable', () => {
    const port = createPort();
    const allocated = port.get();
    {
      using _released = Deno.listen({ port: allocated });
    }
    const selected = port.get(allocated);
    expect(selected).to.eql(allocated);
    using _released = Deno.listen({ port: selected });
  });

  it('random address inspection failure → real listener released', () => {
    const cause = new Error('Address inspection failed');
    let allocated = 0;
    let closed = 0;
    const port = createPort((options) => {
      const listener = Deno.listen(options);
      allocated = (listener.addr as Deno.NetAddr).port;
      return {
        get addr(): Deno.NetAddr {
          throw cause;
        },
        close() {
          listener.close();
          closed++;
        },
      };
    });
    expect(catchCause(() => port.get())).to.equal(cause);
    expect(closed).to.eql(1);
    using _released = Deno.listen({ port: allocated });
  });

  it('later target failure → earlier real listener released', () => {
    const cause = new Error('Later probe failed');
    using allocation = Deno.listen({ port: 0 });
    const pref = (allocation.addr as Deno.NetAddr).port;
    allocation.close();
    const port = createPort((options) => {
      if (options.port === 0) throw new Deno.errors.NotSupported('Synthetic family absence');
      if (options.hostname === '127.0.0.1') throw cause;
      return Deno.listen(options);
    });
    expect(catchCause(() => port.get(pref))).to.equal(cause);
    using _released = Deno.listen({ hostname: '0.0.0.0', port: pref });
  });
});

Deno.test({
  name: 'Net.Port denied IPv6 inspection → actual refusal, not cached family absence',
  permissions: { net: ['0.0.0.0', '127.0.0.1'] },
  fn() {
    const calls: Options[] = [];
    const port = createPort((options) => {
      calls.push(options);
      return Deno.listen(options);
    });
    expect(() => port.get(8080)).to.throw(Deno.errors.NotCapable);
    expect(port.inUse(8080)).to.eql(true);
    expect(calls).to.eql([
      { hostname: '::', port: 0 },
      { hostname: '::', port: 0 },
    ]);
    expect(port.get(0)).to.eql(0);
    expect(calls.length).to.eql(2);
  },
});

/** Track attempted targets and successful releases independently. */
function listeners(before: (options: Options) => void = () => {}) {
  const calls: Options[] = [];
  const closed: Options[] = [];
  const listen: PortListen = (options) => {
    calls.push(options);
    before(options);
    return {
      addr: { transport: 'tcp', hostname: options.hostname ?? '0.0.0.0', port: options.port },
      close() {
        closed.push(options);
      },
    };
  };
  return { listen, calls, closed };
}

function refusals(): unknown[] {
  return [
    new Deno.errors.PermissionDenied('Refused'),
    new Deno.errors.NotCapable('Refused'),
    new Deno.errors.AddrNotAvailable('Unknown capability'),
    new Deno.errors.AddrInUse('Discovery conflict'),
    new Error('Ambiguous substrate failure'),
    { name: 'NotSupported' },
  ];
}

function catchCause(fn: () => unknown): unknown {
  try {
    fn();
  } catch (cause) {
    return cause;
  }
}
