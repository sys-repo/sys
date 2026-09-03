import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Dist, DistServer } from '../mod.ts';

type IsGenerationFailure<T> = T extends t.Dist.Generation.Failure.Result ? true : false;
type UnownedMaterializationFailure = IsGenerationFailure<{
  kind: 'failed';
  phase: 'materialization';
  reason: 'execution-failure';
  ownership: 'not-acquired';
}>;
type BusyInputFailure = IsGenerationFailure<{
  kind: 'failed';
  phase: 'input';
  reason: 'busy';
  ownership: 'not-acquired';
}>;
type OwnedMaterializationFailure = IsGenerationFailure<{
  kind: 'failed';
  phase: 'materialization';
  reason: 'execution-failure';
  ownership: 'released';
}>;
type ServePinned = (args: t.DistServer.Serve.Args) => Promise<void>;
type ServePinnedNested = (
  args: t.DistServer.Serve.NestedArgs,
) => Promise<t.DistServer.Serve.Result>;
type ServeLocal = (args: t.DistServer.Local.ServeArgs) => Promise<void>;
type ServeLocalNested = (
  args: t.DistServer.Local.Serve.NestedArgs,
) => Promise<t.DistServer.Serve.Result>;

describe('@sys/server/dist', () => {
  it('exports exact frozen runtime namespaces', async () => {
    const m = await import('@sys/server/dist');
    const host = await import('@sys/server/dist/server');

    expect(m.Dist).to.equal(Dist);
    expect(m.DistServer).to.equal(DistServer);
    expect(Object.keys(m)).to.eql(['Dist', 'DistServer']);
    expect(Object.keys(host)).to.eql(['DistServer']);
    expect(host.DistServer).to.equal(DistServer);
    expect(Object.keys(Dist)).to.eql(['materialize', 'Generation']);
    expect(Object.keys(Dist.Generation)).to.eql(['open']);
    expect(Object.keys(DistServer)).to.eql(['start', 'serve', 'Local', 'Error']);
    expect(Object.keys(DistServer.Local)).to.eql(['start', 'serve']);
    expect(Object.isFrozen(Dist)).to.eql(true);
    expect(Object.isFrozen(Dist.Generation)).to.eql(true);
    expect(Object.isFrozen(DistServer)).to.eql(true);
    expect(Object.isFrozen(DistServer.Local)).to.eql(true);
  });

  it('binds runtime operations to their public contracts', () => {
    expectTypeOf(Dist).toEqualTypeOf<t.Dist.Lib>();
    expectTypeOf(Dist.Generation.open).toEqualTypeOf<t.Dist.Generation.Open.Method>();
    expectTypeOf(DistServer).toEqualTypeOf<t.DistServer.Lib>();
  });

  it('excludes impossible Generation failure combinations', () => {
    expectTypeOf<UnownedMaterializationFailure>(false).toEqualTypeOf<false>();
    expectTypeOf<BusyInputFailure>(false).toEqualTypeOf<false>();
    expectTypeOf<OwnedMaterializationFailure>(true).toEqualTypeOf<true>();
  });

  it('resolves pinned serving overloads', () => {
    const serve: ServePinned = (args) => DistServer.serve(args);
    const serveNested: ServePinnedNested = (args) => DistServer.serve(args);

    expectTypeOf(serve).toEqualTypeOf<ServePinned>();
    expectTypeOf(serveNested).toEqualTypeOf<ServePinnedNested>();
  });

  it('resolves local serving overloads', () => {
    const serve: ServeLocal = (args) => DistServer.Local.serve(args);
    const serveNested: ServeLocalNested = (args) => DistServer.Local.serve(args);

    expectTypeOf(serve).toEqualTypeOf<ServeLocal>();
    expectTypeOf(serveNested).toEqualTypeOf<ServeLocalNested>();
  });

  it('carries Rooted seal evidence on every successful materialization', () => {
    const seal: t.FsRooted.SealApplied = { kind: 'applied', changed: false };

    expectTypeOf(seal).toEqualTypeOf<t.Dist.Existing['seal']>();
    expectTypeOf(seal).toEqualTypeOf<t.Dist.Promoted['seal']>();
  });

  it('accepts closed browser-policy variants', () => {
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
