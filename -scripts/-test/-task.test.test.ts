import { describe, expect, it } from '@sys/testing/server';
import { defaultTestArgs, hasParallelFlag, main } from '../task.test.ts';

describe('scripts/task.test', () => {
  it('exports a main entrypoint', () => {
    expect(typeof main).to.equal('function');
  });

  it('defaults root test args to the parallel runner', () => {
    expect(defaultTestArgs([])).to.eql(['--parallel']);
    expect(defaultTestArgs(['--jobs=8'])).to.eql(['--parallel', '--jobs=8']);
    expect(defaultTestArgs(['--', '--jobs=auto'])).to.eql(['--parallel', '--jobs=auto']);
    expect(defaultTestArgs(['--parallel', '--', '--jobs=8'])).to.eql(['--parallel', '--jobs=8']);
  });

  it('preserves explicit parallel strategy args', () => {
    expect(defaultTestArgs(['--parallel=false'])).to.eql(['--parallel=false']);
    expect(defaultTestArgs(['--parallel', '--jobs=4'])).to.eql(['--parallel', '--jobs=4']);
    expect(hasParallelFlag(['--parallel=false'])).to.eql(true);
  });
});
