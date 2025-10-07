import { c, describe, expect, it } from '../-test.ts';
import { A } from './common.ts';
import { Debug } from './mod.ts';

const nextTick = () => Promise.resolve();

describe(`Debug Tools`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-automerge/debug');
    expect(m.Debug).to.equal(Debug);
  });

  it('installTripwireGetHeads: warns on re-entrant heads access (patched or fallback)', async () => {
    const origWarn = console.warn;
    const calls: unknown[][] = [];
    console.warn = (...args: unknown[]) => calls.push(args);

    Debug.installTripwireGetHeads(true);

    const doc = A.change(A.init<any>(), (d) => (d.y = 1));
    const desc = Object.getOwnPropertyDescriptor(A, 'getHeads');

    Debug.Reentry.enter('tripwire', () => {
      if (desc?.writable) {
        A.getHeads(doc); // patched mode -> warns
      } else {
        expect(() => Debug.getHeadsSafe(doc)).to.throw(/getHeadsSafe/); // fallback mode -> warns + throws
      }
    });

    console.warn = origWarn;
    expect(calls.length).to.be.greaterThan(0);
    expect(String(calls[0][0])).to.contain('[tripwire]');
  });

  it('defer + coalesce', async () => {
    let ran = false;
    Debug.defer(() => (ran = true));
    expect(ran).to.equal(false);
    await nextTick();
    expect(ran).to.equal(true);

    const schedule = Debug.coalesce();
    let n = 0;
    schedule(() => n++);
    schedule(() => n++);
    schedule(() => n++);
    expect(n).to.equal(0);
    await nextTick();
    expect(n).to.equal(1);
  });

  it('Reentry labels', () => {
    expect(Debug.Reentry.inCallback()).to.equal(false);
    Debug.Reentry.enter('outer', () => {
      expect(Debug.Reentry.inCallback()).to.equal(true);
      expect(Debug.Reentry.labels()).to.eql(['outer']);
      Debug.Reentry.enter('inner', () => {
        expect(Debug.Reentry.labels()).to.eql(['outer', 'inner']);
      });
      expect(Debug.Reentry.labels()).to.eql(['outer']);
    });
    expect(Debug.Reentry.labels()).to.eql([]);
  });

  it('getHeadsSafe / getHeadsDeferred basics', async () => {
    const doc = A.change(A.init<any>(), (d) => (d.x = 1));
    expect(Debug.getHeadsSafe(doc)).to.eql(A.getHeads(doc));

    console.info();
    console.info(c.cyan('Tripwire expected:'));
    console.info();

    let got: readonly string[] | undefined;
    Debug.Reentry.enter('defer', () => {
      Debug.getHeadsDeferred(doc, (h) => (got = h));
      expect(got).to.equal(undefined);
    });
    await nextTick();
    expect(got).to.eql(A.getHeads(doc));

    console.info();
  });
});
