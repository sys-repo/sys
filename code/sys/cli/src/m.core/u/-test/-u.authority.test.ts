import { describe, expect, it } from '../../../-test.ts';
import {
  createSynchronousAuthority,
  snapshotProperty,
  snapshotShape,
  snapshotsReady,
} from '../u.authority.ts';

const defineProperty = Object.defineProperty;
const getPrototypeOf = Object.getPrototypeOf;
const setPrototypeOf = Object.setPrototypeOf;

const MESSAGE = 'Test authority unavailable.';

describe('CLI synchronous authority primitive', () => {
  it('compares exact values, complete shapes, prototypes, and expected absence', () => {
    const target = { value: Number.NaN } as { value: number; added?: number };
    const snapshots = [snapshotShape(target), snapshotProperty(target, 'missing')];

    expect(snapshotsReady(snapshots)).to.eql(true);

    target.value = 1;
    expect(snapshotsReady(snapshots)).to.eql(false);
    target.value = Number.NaN;
    expect(snapshotsReady(snapshots)).to.eql(true);

    target.added = 1;
    expect(snapshotsReady(snapshots)).to.eql(false);
    delete target.added;
    expect(snapshotsReady(snapshots)).to.eql(true);

    const prototype = getPrototypeOf(target);
    setPrototypeOf(target, null);
    expect(snapshotsReady(snapshots)).to.eql(false);
    setPrototypeOf(target, prototype);
    expect(snapshotsReady(snapshots)).to.eql(true);

    defineProperty(target, 'missing', { configurable: true, value: 1 });
    expect(snapshotsReady(snapshots)).to.eql(false);
    delete (target as Record<PropertyKey, unknown>).missing;
    expect(snapshotsReady(snapshots)).to.eql(true);
  });

  it('re-admits around caller work and preserves errors only while authority stays intact', () => {
    const target = { value: 1 };
    const snapshots = [snapshotShape(target)];
    const authority = createSynchronousAuthority(MESSAGE, [() => snapshotsReady(snapshots)]);
    const callerFailure = new Error('caller failure');

    let unchangedFailure: unknown;
    try {
      authority.run(() => {
        throw callerFailure;
      });
    } catch (cause) {
      unchangedFailure = cause;
    }
    expect(unchangedFailure).to.equal(callerFailure);

    let changedFailure: unknown;
    try {
      authority.run(() => {
        target.value = 2;
        throw callerFailure;
      });
    } catch (cause) {
      changedFailure = cause;
    } finally {
      target.value = 1;
    }

    expect(changedFailure).to.be.instanceOf(Error);
    expect((changedFailure as Error).message).to.eql(MESSAGE);
    expect(Object.isFrozen(changedFailure)).to.eql(true);
    expect(authority.isReady()).to.eql(true);
  });
});
