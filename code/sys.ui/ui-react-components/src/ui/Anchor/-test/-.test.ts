import React from 'react';
import {
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';

import { A, Anchor } from '../mod.ts';

describe('Anchor', () => {
  DomMock.init({ beforeAll, afterAll });

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

    it('normalizes rel behavior across rendered anchor cases', async () => {
      const Test: React.FC = () =>
        React.createElement(
          'div',
          undefined,
          React.createElement(A, { href: 'https://example.com/a', target: '_blank' }, 'a'),
          React.createElement(
            A,
            { href: 'https://example.com/b', target: '_blank', rel: 'nofollow noopener' },
            'b',
          ),
          React.createElement(A, { href: 'https://example.com/c', target: '_self', rel: 'nofollow' }, 'c'),
        );

      const res = await TestReact.render(React.createElement(Test), { strict: false });
      const list = [...res.container.querySelectorAll('a')] as HTMLAnchorElement[];
      expect(list.length).to.eql(3);
      expect(list[0].getAttribute('target')).to.eql('_blank');
      expect(list[0].getAttribute('rel')).to.eql('noopener noreferrer');
      expect(list[1].getAttribute('rel')).to.eql('nofollow noopener noreferrer');
      expect(list[2].getAttribute('rel')).to.eql('nofollow');
      res.dispose();
    });
  });
});
