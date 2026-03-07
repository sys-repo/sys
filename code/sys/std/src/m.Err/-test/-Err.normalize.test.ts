import { type t, describe, expect, it } from '../../-test.ts';
import { Err } from '../mod.ts';

describe('Err.normalize', () => {
  it('returns native Error instances unchanged (identity)', () => {
    const error = new Error('boom');
    const normalized = Err.normalize(error);

    expect(normalized).to.eql(error);
    expect(normalized.message).to.eql('boom');
  });

  it('lifts error-like objects into Error and copies enumerable fields', () => {
    const input: t.ErrorLike & { code: string; kind: string } = {
      message: 'something went wrong',
      code: 'E_TEST',
      kind: 'CrdtRepoError',
    };

    const normalized = Err.normalize(input);

    expect(normalized).to.be.instanceOf(Error);
    expect(normalized.message).to.eql('something went wrong');

    // Extra fields are copied across for downstream access.
    expect((normalized as any).code).to.eql('E_TEST');
    expect((normalized as any).kind).to.eql('CrdtRepoError');
  });

  it('preserves explicit name for error-like inputs', () => {
    const input: t.ErrorLike & { name: string } = {
      message: 'repo failed',
      name: 'CrdtRepoError',
    };

    const normalized = Err.normalize(input);

    expect(normalized).to.be.instanceOf(Error);
    expect(normalized.message).to.eql('repo failed');
    expect(normalized.name).to.eql('CrdtRepoError');
  });

  it('stringifies non-error-like inputs', () => {
    const cases: Array<{ input: unknown; expected: string }> = [
      { input: 'plain string', expected: 'plain string' },
      { input: 123, expected: '123' },
      { input: false, expected: 'false' },
      { input: null, expected: 'null' },
      { input: undefined, expected: 'undefined' },
    ];

    for (const { input, expected } of cases) {
      const normalized = Err.normalize(input);
      expect(normalized).to.be.instanceOf(Error);
      expect(normalized.message).to.eql(expected);
    }
  });
});
