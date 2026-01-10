import { describe, expect, expectError, it } from '../../-test.ts';
import { semaphore } from '../u.semaphore.ts';

describe('Promise.semaphore', () => {
  it('rejects invalid max', async () => {
    await expectError(() => semaphore(0), 'max');
    await expectError(() => semaphore(-1), 'max');
    await expectError(() => semaphore(Number.NaN), 'max');
    await expectError(() => semaphore(Number.POSITIVE_INFINITY), 'max');
  });

  it('floors max', async () => {
    const sem = semaphore(1.9);

    let active = 0;
    let maxActive = 0;
    const releases: Array<() => void> = [];

    const waitForRelease = async (index: number) => {
      for (let i = 0; i < 10; i++) {
        if (releases[index]) return;
        await Promise.resolve();
      }
      throw new Error(`semaphore: release ${index} not set`);
    };

    const task = (id: number) =>
      sem(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise<void>((resolve) => {
          releases[id] = resolve;
        });
        active -= 1;
        return id;
      });

    const tasks = [0, 1].map(task);

    await Promise.resolve();
    expect(maxActive).to.eql(1);
    expect(!!releases[0]).to.eql(true);
    expect(!!releases[1]).to.eql(false);

    releases[0]();
    await waitForRelease(1);
    releases[1]();

    const results = await Promise.all(tasks);
    expect(results).to.eql([0, 1]);
    expect(maxActive).to.eql(1);
  });

  it('infers task result type', async () => {
    const sem = semaphore(1);
    const promise: Promise<number> = sem(async () => 123);
    expect(await promise).to.eql(123);
  });

  it('limits concurrent execution', async () => {
    const limit = 2;
    const sem = semaphore(limit);

    let active = 0;
    let maxActive = 0;
    const releases: Array<() => void> = [];

    const task = (id: number) =>
      sem(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise<void>((resolve) => {
          releases[id] = resolve;
        });
        active -= 1;
        return id;
      });

    const tasks = [0, 1, 2, 3, 4].map(task);

    await Promise.resolve();
    expect(maxActive).to.eql(2);
    expect(!!releases[0]).to.eql(true);
    expect(!!releases[1]).to.eql(true);

    releases[0]();
    releases[1]();

    const waitForRelease = async (index: number) => {
      for (let i = 0; i < 10; i++) {
        if (releases[index]) return;
        await Promise.resolve();
      }
      throw new Error(`semaphore: release ${index} not set`);
    };

    await waitForRelease(2);
    await waitForRelease(3);
    releases[2]();
    releases[3]();

    await waitForRelease(4);
    releases[4]();

    const results = await Promise.all(tasks);
    expect(results).to.eql([0, 1, 2, 3, 4]);
    expect(maxActive).to.eql(limit);
  });

  it('continues after rejection', async () => {
    const sem = semaphore(1);
    const err = new Error('boom');

    const first = sem(async () => {
      throw err;
    });
    const second = sem(async () => 'ok');

    await expectError(() => first, 'boom');
    const res = await second;
    expect(res).to.eql('ok');
  });
});
