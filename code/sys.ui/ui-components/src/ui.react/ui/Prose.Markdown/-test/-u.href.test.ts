import { describe, expect, it } from './common.ts';
import { toSafeHref } from '../u/u.href.ts';

describe('Prose.Markdown: href policy', () => {
  it('allows safe absolute and document-local hrefs', () => {
    const hrefs = [
      'https://example.com/a?b=1#x',
      'http://example.com',
      'mailto:hello@example.com',
      'tel:+123',
      '#section',
      '/docs',
      './docs',
      '../docs',
    ];

    hrefs.forEach((href) => expect(toSafeHref(href)).to.eql(href));
  });

  it('trims edge whitespace before returning a safe href', () => {
    expect(toSafeHref('\n https://example.com/docs \n')).to.eql('https://example.com/docs');
  });

  it('rejects empty, protocol-relative, and unsafe-scheme hrefs', () => {
    const hrefs = [
      undefined,
      null,
      '',
      '   ',
      '//example.com/path',
      'javascript:alert(1)',
      'data:text/html,<b>x</b>',
      'ftp://example.com',
    ];

    hrefs.forEach((href) => expect(toSafeHref(href)).to.eql(undefined));
  });
});
