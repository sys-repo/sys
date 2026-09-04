import React from 'react';
import { type t, describe, expect, it } from '../../../-test.ts';
import { isAnchorElement, isSafeHref, resolveHref, toDisplayLabel } from '../u/u.href.ts';

describe('KeyValue/u.href', () => {
  it('string shorthand applies to value side by default', () => {
    const href = 'https://example.com';
    expect(resolveHref({ href, side: 'v', children: 'x' })).to.eql({
      href,
      display: 'raw',
      target: '_blank',
      rel: undefined,
    });
    expect(resolveHref({ href, side: 'k', children: 'x' })).to.eql(undefined);
  });

  it('props-only object applies to value side by default', () => {
    const href = { infer: true, open: 'inline' } satisfies t.KeyValue.Link.Props;
    expect(resolveHref({ href, side: 'v', children: 'https://example.com' })).to.eql({
      href: 'https://example.com',
      display: 'raw',
      rel: undefined,
    });
    expect(resolveHref({ href, side: 'k', children: 'https://example.com' })).to.eql(undefined);
  });

  it('supports per-side split links', () => {
    const href: t.KeyValue.Link.Href = { k: true, v: 'https://example.com/value' };
    const k = resolveHref({ href, side: 'k', children: 'https://example.com/key' });
    const v = resolveHref({ href, side: 'v', children: 'ignored' });
    expect(k?.href).to.eql('https://example.com/key');
    expect(k?.display).to.eql('raw');
    expect(k?.target).to.eql('_blank');
    expect(v?.href).to.eql('https://example.com/value');
    expect(v?.display).to.eql('raw');
    expect(v?.target).to.eql('_blank');
  });

  it('boolean true infers from text children only', () => {
    const link = resolveHref({ href: true, side: 'v', children: 'https://example.com' });
    expect(link?.href).to.eql('https://example.com');
    expect(link?.display).to.eql('raw');
    expect(link?.target).to.eql('_blank');
    expect(resolveHref({ href: true, side: 'v', children: ['x'] })).to.eql(undefined);
  });

  it('rejects unsafe schemes', () => {
    expect(isSafeHref('javascript:alert(1)')).to.eql(false);
    expect(resolveHref({ href: 'javascript:alert(1)', side: 'v', children: 'x' })).to.eql(undefined);
    expect(resolveHref({ href: true, side: 'v', children: 'javascript:alert(1)' })).to.eql(undefined);
  });

  it('allows safe non-http href forms', () => {
    expect(isSafeHref('mailto:test@example.com')).to.eql(true);
    expect(isSafeHref('tel:+1234')).to.eql(true);
    expect(isSafeHref('/path/to/resource')).to.eql(true);
    expect(isSafeHref('./local')).to.eql(true);
    expect(isSafeHref('../up-one')).to.eql(true);
    expect(isSafeHref('#fragment')).to.eql(true);
  });

  it('detects existing anchor children for bypass path', () => {
    expect(isAnchorElement('text')).to.eql(false);
    expect(
      isAnchorElement(React.createElement('a', { href: 'https://example.com' }, 'x')),
    ).to.eql(true);
  });

  it('trims display label only when configured', () => {
    const link = resolveHref({
      href: { href: 'https://example.com/path', display: 'trim-http' },
      side: 'v',
      children: 'https://example.com/path',
    });
    expect(link?.href).to.eql('https://example.com/path');
    expect(link?.display).to.eql('trim-http');
    expect(link?.target).to.eql('_blank');
    expect(toDisplayLabel(link, 'https://example.com/path')).to.eql('example.com/path');
    expect(toDisplayLabel(link, 123)).to.eql('123');
    expect(toDisplayLabel(link, ['x'])).to.eql(['x']);
  });
});
