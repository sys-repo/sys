import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Dist, DistServer } from '../mod.ts';

describe('@sys/server/dist', () => {
  it('API', async () => {
    const m = await import('@sys/server/dist');
    const host = await import('@sys/server/dist/server');

    expect(m.Dist).to.equal(Dist);
    expect(m.DistServer).to.equal(DistServer);
    expect(Object.keys(m)).to.eql(['Dist', 'DistServer']);
    expect(Object.keys(host)).to.eql(['DistServer']);
    expect(host.DistServer).to.equal(DistServer);
    expect(Object.keys(Dist)).to.eql(['materialize']);
    expect(Object.keys(DistServer)).to.eql(['start', 'serve', 'Local', 'Error']);
    expect(Object.keys(DistServer.Local)).to.eql(['start', 'serve']);
    expect(Object.isFrozen(Dist)).to.eql(true);
    expect(Object.isFrozen(DistServer)).to.eql(true);
    expect(Object.isFrozen(DistServer.Local)).to.eql(true);
    expectTypeOf(Dist).toEqualTypeOf<t.Dist.Lib>();
    expectTypeOf(DistServer).toEqualTypeOf<t.DistServer.Lib>();

    const servePinned = (args: t.DistServer.Serve.Args) => DistServer.serve(args);
    const servePinnedNested = (args: t.DistServer.Serve.NestedArgs) => DistServer.serve(args);
    const serveLocal = (args: t.DistServer.Local.ServeArgs) => DistServer.Local.serve(args);
    const serveLocalNested = (args: t.DistServer.Local.Serve.NestedArgs) => {
      return DistServer.Local.serve(args);
    };
    expectTypeOf(servePinned).toEqualTypeOf<
      (args: t.DistServer.Serve.Args) => Promise<void>
    >();
    expectTypeOf(servePinnedNested).toEqualTypeOf<
      (args: t.DistServer.Serve.NestedArgs) => Promise<t.DistServer.Serve.Result>
    >();
    expectTypeOf(serveLocal).toEqualTypeOf<
      (args: t.DistServer.Local.ServeArgs) => Promise<void>
    >();
    expectTypeOf(serveLocalNested).toEqualTypeOf<
      (args: t.DistServer.Local.Serve.NestedArgs) => Promise<t.DistServer.Serve.Result>
    >();

    expectTypeOf({ kind: 'applied', changed: false } as t.Dist.Existing['seal'])
      .toEqualTypeOf<t.FsRooted.SealApplied>();
    expectTypeOf({ kind: 'applied', changed: false } as t.Dist.Promoted['seal'])
      .toEqualTypeOf<t.FsRooted.SealApplied>();

    const zeroWorkerPolicy = {
      kind: 'verified-loopback',
      dedicatedWorkers: [],
      serviceWorker: { kind: 'deny' },
    } as const satisfies t.DistServer.BrowserPolicy.Input;
    const workerPolicy = {
      kind: 'verified-loopback',
      dedicatedWorkers: [
        { kind: 'asset', path: 'workers/default.js' },
        { kind: 'blob', worker: 'workers/json.js' },
      ],
      serviceWorker: { kind: 'tombstone', path: 'sw.js' },
    } as const satisfies t.DistServer.BrowserPolicy.Input;
    expectTypeOf(zeroWorkerPolicy).toMatchTypeOf<t.DistServer.BrowserPolicy.Input>();
    expectTypeOf(workerPolicy).toMatchTypeOf<t.DistServer.BrowserPolicy.Input>();
  });
});
