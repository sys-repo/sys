import { describe, expect, it } from '../../-test.ts';
import { Err } from '../mod.ts';

describe('Err.summary', () => {
  it('Error → "Name: message" (no options)', () => {
    const err = new Error('boom');
    const out = Err.summary(err);
    expect(out).to.equal('Error: boom');
  });

  it('non-error values fall back to String(input)', () => {
    expect(Err.summary('foo')).to.equal('foo');
    expect(Err.summary(42)).to.equal('42');
    expect(Err.summary(null)).to.equal('null');
    expect(Err.summary(undefined)).to.equal('undefined');
    expect(Err.summary({ foo: 'bar' })).to.equal('[object Object]');
  });

  it('includes cause when opts.cause = true', () => {
    const inner = new Error('inner');
    const outer = new Error('outer');
    (outer as Error & { cause?: unknown }).cause = inner;

    const out = Err.summary(outer, { cause: true });
    const lines = out.split('\n');

    expect(lines[0]).to.equal('Error: outer');
    expect(lines[1]).to.equal('Cause: Error: inner');
  });

  it('includes stack when opts.stack = true', () => {
    const err = new Error('boom');
    const out = Err.summary(err, { stack: true });

    const lines = out.split('\n');
    expect(lines[0]).to.equal('Error: boom');
    expect(out.length).to.be.greaterThan('Error: boom'.length);
  });

  it('handles cyclic causes without infinite recursion', () => {
    const a = new Error('a');
    const b = new Error('b');

    (a as Error & { cause?: unknown }).cause = b;
    (b as Error & { cause?: unknown }).cause = a;

    const out = Err.summary(a, { cause: true });

    expect(out).to.contain('Error: a');
    expect(out).to.contain('Cause: Error: b');
  });
});
