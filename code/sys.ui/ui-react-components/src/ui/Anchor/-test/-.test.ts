import React from 'react';
import { describe, expect, it } from '../../../-test.ts';

import { A, Anchor } from '../mod.ts';

describe('Anchor', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.A).to.equal(A);
    expect(m.Anchor).to.equal(Anchor);
    expect(m.Anchor.UI).to.equal(A);
  });

  describe('element', () => {
    it('passes children through when href is undefined', () => {
      const res = A({ href: undefined, children: 'plain text' });
      expect(res).to.eql('plain text');
    });

    it('hardens _blank links with noopener noreferrer', () => {
      const el = asElement(A({ href: 'https://example.com', target: '_blank', children: 'link' }));
      expect(el.props.target).to.eql('_blank');
      expect(el.props.rel).to.eql('noopener noreferrer');
    });

    it('merges and dedupes caller rel for _blank links', () => {
      const el = asElement(
        A({
          href: 'https://example.com',
          target: '_blank',
          rel: 'nofollow noopener',
          children: 'link',
        }),
      );
      expect(el.props.rel).to.eql('nofollow noopener noreferrer');
    });

    it('preserves caller rel when target is not _blank', () => {
      const el = asElement(
        A({
          href: 'https://example.com',
          target: '_self',
          rel: 'nofollow',
          children: 'link',
        }),
      );
      expect(el.props.rel).to.eql('nofollow');
    });
  });
});

/**
 * Helpers
 */
function asElement(
  node: React.ReactNode | Promise<React.ReactNode>,
): React.ReactElement<{ target?: string; rel?: string }> {
  expect(node instanceof Promise).to.eql(false);
  expect(React.isValidElement(node)).to.eql(true);
  return node as React.ReactElement<{ target?: string; rel?: string }>;
}
