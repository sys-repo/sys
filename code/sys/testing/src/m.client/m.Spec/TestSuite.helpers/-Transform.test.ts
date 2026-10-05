import { describe, expect, it } from '../../-test.ts';
import { Test } from '../mod.ts';
import { Transform } from './Transform.ts';

const output: string[] = [];

const root = Test.describe('root(A)', (e) => {
  e.it('root-1', (e) => {
    expect(123).to.eql(123);
    output.push('root-1');
  });
  e.describe('child-1', (e) => {
    e.it('child-1a', () => {
      expect(123).to.eql(123);
      output.push('child-1a');
    });
  });
  e.describe('child-2', (e) => {
    e.it.skip('child-2a', () => {
      output.push('child-2a'); // NB: skipped.
      expect(123).to.eql('FAIL');
    });
    e.it('child-2b', () => {
      output.push('child-2b');
    });
  });
  e.describe.skip('child-3', (e) => {
    e.it('child-3a', () => {
      output.push('child-3a'); // NB: skipped via parent [describe.skip].
    });
  });
});

/**
 * Prepare the test suite for execution.
 */
await Transform(describe, it as any).suite(root);

/**
 * Examine the transformed test suite (that has just been run).
 */
describe('examine tranformed', () => {
  it('output', () => {
    expect(output).to.eql(['root-1', 'child-1a', 'child-2b']);
  });
});
