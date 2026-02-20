import React from 'react';
import { type t, describe, expect, it } from '../../../-test.ts';
import { isAnchorElement, isSafeHref, resolveHref } from '../u.href.ts';

describe('KeyValue/u.href', () => {
  it('string shorthand applies to value side by default', () => {
    const href = 'https://example.com';
    expect(resolveHref({ href, side: 'v', children: 'x' })).to.eql({
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(resolveHref({ href, side: 'k', children: 'x' })).to.equal(undefined);
  });

  it('props-only object applies to value side by default', () => {
    const href = { infer: true, open: 'inline' } satisfies t.KeyValueLinkProps;
    expect(resolveHref({ href, side: 'v', children: 'https://example.com' })).to.eql({
      href: 'https://example.com',
      rel: undefined,
    });
    expect(resolveHref({ href, side: 'k', children: 'https://example.com' })).to.equal(undefined);
  });

  it('supports per-side split links', () => {
    const href: t.KeyValueHref = { k: true, v: 'https://example.com/value' };
    expect(resolveHref({ href, side: 'k', children: 'https://example.com/key' })).to.eql({
      href: 'https://example.com/key',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(resolveHref({ href, side: 'v', children: 'ignored' })).to.eql({
      href: 'https://example.com/value',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });

  it('boolean true infers from text children only', () => {
    expect(resolveHref({ href: true, side: 'v', children: 'https://example.com' })).to.eql({
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(resolveHref({ href: true, side: 'v', children: ['x'] })).to.equal(undefined);
  });

  it('rejects unsafe schemes', () => {
    expect(isSafeHref('javascript:alert(1)')).to.equal(false);
    expect(resolveHref({ href: 'javascript:alert(1)', side: 'v', children: 'x' })).to.equal(undefined);
    expect(resolveHref({ href: true, side: 'v', children: 'javascript:alert(1)' })).to.equal(undefined);
  });

  it('allows safe non-http href forms', () => {
    expect(isSafeHref('mailto:test@example.com')).to.equal(true);
    expect(isSafeHref('tel:+1234')).to.equal(true);
    expect(isSafeHref('/path/to/resource')).to.equal(true);
    expect(isSafeHref('./local')).to.equal(true);
    expect(isSafeHref('../up-one')).to.equal(true);
    expect(isSafeHref('#fragment')).to.equal(true);
  });

  it('detects existing anchor children for bypass path', () => {
    expect(isAnchorElement('text')).to.equal(false);
    expect(
      isAnchorElement(React.createElement('a', { href: 'https://example.com' }, 'x')),
    ).to.equal(true);
  });
});
