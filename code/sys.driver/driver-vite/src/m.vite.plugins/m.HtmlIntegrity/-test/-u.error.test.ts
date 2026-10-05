import { describe, expect, it } from '../../../-test.ts';
import { integrityError } from '../u.error.ts';

describe('HTML integrity diagnostics', () => {
  it('returns a native Error without placeholder context', () => {
    const error = integrityError('custom HTML asset sources are unsupported');
    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.eql('[sys:html-integrity] custom HTML asset sources are unsupported');
  });

  it('includes HTML context without inventing a resource URL', () => {
    const error = integrityError('duplicate HTML attribute', { htmlFile: 'nested/index.html' });
    expect(error.message).to.eql(
      '[sys:html-integrity] nested/index.html: duplicate HTML attribute',
    );
  });

  it('treats an undefined URL as absent context', () => {
    const error = integrityError(
      'duplicate HTML attribute',
      { htmlFile: 'index.html', url: undefined },
    );
    expect(error.message).to.eql('[sys:html-integrity] index.html: duplicate HTML attribute');
  });

  it('preserves quoted resource diagnostics', () => {
    const error = integrityError(
      'missing emitted output public.js',
      { htmlFile: 'nested/index.html', url: '../public.js?v=2' },
    );
    expect(error.message).to.eql(
      '[sys:html-integrity] nested/index.html: "../public.js?v=2": missing emitted output public.js',
    );
  });

  it('preserves an explicitly empty resource URL', () => {
    const error = integrityError('authored input integrity', { htmlFile: 'index.html', url: '' });
    expect(error.message).to.eql('[sys:html-integrity] index.html: "": authored input integrity');
  });

  it('escapes resource quotes, backslashes, and control characters', () => {
    const error = integrityError(
      'unsafe URL',
      { htmlFile: 'index.html', url: 'pkg/"entry"\\next.js\n?v=1#x' },
    );
    expect(error.message).to.eql(
      '[sys:html-integrity] index.html: "pkg/\\"entry\\"\\\\next.js\\n?v=1#x": unsafe URL',
    );
  });
});
