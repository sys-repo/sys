import { describe, EsmAssert, expect, it } from '../../src/-test.ts';
import { markCliSettledFailure } from '../../src/m.core/m.cli.profiles/u/u.start.gui.settlement.ts';
import { TaskCli } from '../task.cli.u.ts';

const ENTRY = new URL('../task.cli.ts', import.meta.url).pathname;

describe('driver-pi/scripts/task.cli settlement', () => {
  it('keeps the default task graph outside GUI and server runtime', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: ENTRY,
      forbiddenImports: ['@sys/server'],
      forbiddenPathIncludes: [
        '/m.cli.profiles/u.start/',
        '\\m.cli.profiles\\u.start\\',
      ],
    });
  });

  it('returns zero after successful CLI settlement', async () => {
    expect(await TaskCli.settle(() => Promise.resolve())).to.eql(0);
  });

  it('returns one only for an authenticated settled GUI failure', async () => {
    const failure = new Error('presented GUI failure');
    markCliSettledFailure(failure);
    expect(await TaskCli.settle(() => Promise.reject(failure))).to.eql(1);
  });

  it('keeps settlement authentication closed after ambient WeakSet mutation', async () => {
    const add = Object.getOwnPropertyDescriptor(WeakSet.prototype, 'add');
    const has = Object.getOwnPropertyDescriptor(WeakSet.prototype, 'has');
    if (!add || !has) throw new Error('Expected WeakSet method descriptors.');
    let ambientCalls = 0;
    let exitCode: 0 | 1 | undefined;

    try {
      const replacement = {
        value() {
          ambientCalls += 1;
          throw new Error('ambient WeakSet method invoked');
        },
      };
      Object.defineProperty(WeakSet.prototype, 'add', { ...add, ...replacement });
      Object.defineProperty(WeakSet.prototype, 'has', { ...has, ...replacement });
      const failure = new Error('presented GUI failure');
      markCliSettledFailure(failure);
      exitCode = await TaskCli.settle(() => Promise.reject(failure));
    } finally {
      Object.defineProperty(WeakSet.prototype, 'add', add);
      Object.defineProperty(WeakSet.prototype, 'has', has);
    }

    expect(exitCode).to.eql(1);
    expect(ambientCalls).to.eql(0);
  });

  it('rethrows an unclassified failure unchanged', async () => {
    const failure = new Error('unowned programmer failure');
    let observed: unknown;
    try {
      await TaskCli.settle(() => Promise.reject(failure));
    } catch (cause) {
      observed = cause;
    }
    expect(observed).to.equal(failure);
  });
});
