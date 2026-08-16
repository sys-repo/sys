import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Dist, DistServer } from '../mod.ts';

describe('@sys/server/dist', () => {
  it('API', async () => {
    const m = await import('@sys/server/dist');

    expect(m.Dist).to.equal(Dist);
    expect(m.DistServer).to.equal(DistServer);
    expect(Object.keys(m)).to.eql(['Dist', 'DistServer']);
    expect(Object.keys(Dist)).to.eql(['materialize']);
    expect(Object.keys(DistServer)).to.eql(['start', 'serve', 'Local', 'Error']);
    expect(Object.keys(DistServer.Local)).to.eql(['start', 'serve']);
    expect(Object.isFrozen(Dist)).to.eql(true);
    expect(Object.isFrozen(DistServer)).to.eql(true);
    expect(Object.isFrozen(DistServer.Local)).to.eql(true);
    expectTypeOf(Dist).toEqualTypeOf<t.Dist.Lib>();
    expectTypeOf(DistServer).toEqualTypeOf<t.DistServer.Lib>();
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
