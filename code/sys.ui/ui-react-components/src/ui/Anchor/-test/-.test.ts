import React from 'react';
import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';

import { A, Anchor } from '../mod.ts';

describe('Anchor', () => {
  DomMock.init({ beforeEach, afterEach });

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

    it('normalizes rel behavior and disabled anchor semantics across rendered cases', async () => {
      let disabledClicks = 0;
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
          React.createElement(
            A,
            { href: 'https://example.com/d', enabled: false, onClick: () => disabledClicks++ },
            'd',
          ),
        );

      const res = await TestReact.render(React.createElement(Test), { strict: false });
      const list = [...res.container.querySelectorAll('a')] as HTMLAnchorElement[];
      expect(list.length).to.eql(4);
      expect(list[0].getAttribute('target')).to.eql('_blank');
      expect(list[0].getAttribute('rel')).to.eql('noopener noreferrer');
      expect(list[1].getAttribute('rel')).to.eql('nofollow noopener noreferrer');
      expect(list[2].getAttribute('rel')).to.eql('nofollow');
      expect(list[3].getAttribute('href')).to.eql(null);
      expect(list[3].getAttribute('aria-disabled')).to.eql('true');
      expect(list[3].getAttribute('tabindex')).to.eql('-1');

      const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      const dispatched = list[3].dispatchEvent(event);
      expect(dispatched).to.eql(false);
      expect(event.defaultPrevented).to.eql(true);
      expect(disabledClicks).to.eql(0);

      act(() => res.dispose());
      await Promise.resolve();
    });
  });
});
