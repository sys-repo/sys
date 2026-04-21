import { describe, expect, it } from '@sys/testing/server';
import { main } from '../task.test.ts';

describe('scripts/task.test', () => {
  it('exports a main entrypoint', () => {
    expect(typeof main).to.equal('function');
  });
});
