import { describe, expect, it } from '../../-test.ts';
import { Err } from '../mod.ts';

describe('Err.summary', () => {
  it('Error → "Name: message" (no options)', () => {
    const err = new Error('boom');
    const out = Err.summary(err);
    expect(out).to.eql('Error: boom');
  });

  it('non-error scalar values preserve simple String(input) semantics', () => {
    expect(Err.summary('foo')).to.eql('foo');
    expect(Err.summary(42)).to.eql('42');
    expect(Err.summary(null)).to.eql('null');
    expect(Err.summary(undefined)).to.eql('undefined');
  });

  it('non-error objects render bounded diagnostics instead of [object Object]', () => {
    expect(Err.summary({ foo: 'bar' })).to.eql('Object');
    expect(Err.summary(['foo', 'bar'])).to.eql('Array(2)');
    expect(Err.summary({ code: 'EADDRINUSE', port: 1234, cwd: '/tmp/private' })).to.eql(
      'Object (code=EADDRINUSE, port=1234)',
    );
  });

  it('error-like records render as errors with bounded diagnostic metadata', () => {
    const out = Err.summary(
      {
        name: 'StartupError',
        message: 'Port already in use',
        code: 'EADDRINUSE',
        port: 1234,
        cause: { cwd: '/tmp/private' },
      },
      { cause: true },
    );

    const lines = out.split('\n');
    expect(lines[0]).to.eql('StartupError: Port already in use (code=EADDRINUSE, port=1234)');
    expect(lines[1]).to.eql('Cause: Object');
  });

  it('diagnostic metadata values are single-line and length-bounded', () => {
    const out = Err.summary({ code: 'EADDRINUSE\nretry', statusText: 'x'.repeat(100) });

    expect(out).to.contain('code=EADDRINUSE retry');
    expect(out).to.contain(`statusText=${'x'.repeat(79)}…`);
  });

  it('includes cause when opts.cause = true', () => {
    const inner = new Error('inner');
    const outer = new Error('outer');
    (outer as Error & { cause?: unknown }).cause = inner;

    const out = Err.summary(outer, { cause: true });
    const lines = out.split('\n');

    expect(lines[0]).to.eql('Error: outer');
    expect(lines[1]).to.eql('Cause: Error: inner');
  });

  it('includes stack when opts.stack = true', () => {
    const err = new Error('boom');
    const out = Err.summary(err, { stack: true });

    const lines = out.split('\n');
    expect(lines[0]).to.eql('Error: boom');
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
