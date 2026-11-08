import React from 'react';
import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  TestReact,
} from '../../../-test.ts';

import type { t } from '../common.ts';
import { A, Anchor } from '../mod.ts';

type Target = t.Anchor.Props['target'];

describe('Anchor', () => {
  DomMock.init({ beforeEach, afterEach });

  it('API', async () => {
    const m = await import('@sys/ui-components/react/anchor');
    expect(m.A).to.equal(A);
    expect(m.Anchor).to.equal(Anchor);
    expect(m.Anchor.UI).to.equal(A);
  });

  describe('element', () => {
    it('passes children through when href is missing or empty, even when disabled', () => {
      for (const href of [undefined, '']) {
        const res = A({ href, enabled: false, children: 'plain text' });
        expect(res).to.eql('plain text');
      }
    });

    it('accepts standard targets and preserves arbitrary named browsing contexts', async () => {
      expectTypeOf<t.Anchor.Target>('_blank').toMatchTypeOf<Target>();
      expectTypeOf<string>('preview-pane').toMatchTypeOf<Target>();
      expectTypeOf<Target>(undefined).toMatchTypeOf<string | undefined>();
      const props: t.Anchor.Props = { href: '/sample', target: 'preview-pane', children: 'Link' };
      const res = await TestReact.render(React.createElement(A, props));
      try {
        const root = res.container.querySelector<HTMLAnchorElement>('a')!;
        expect(root.target).to.eql('preview-pane');
        expect(root.hasAttribute('rel')).to.eql(false);
      } finally {
        act(() => res.dispose());
      }
    });

    it('retains navigation attributes and caller event ownership', async () => {
      let clicks = 0;
      const keys: string[] = [];
      const res = await TestReact.render(React.createElement(A, {
        href: '/sample',
        target: '_blank',
        rel: 'nofollow',
        download: 'sample.txt',
        tabIndex: 3,
        'aria-disabled': true,
        onKeyDown: (e) => keys.push(e.key),
        onClick: (e) => {
          clicks++;
          expect(e.ctrlKey).to.eql(true);
          e.preventDefault();
        },
        children: 'Link',
      }));
      try {
        const root = res.container.querySelector<HTMLAnchorElement>('a')!;
        expect(root.getAttribute('href')).to.eql('/sample');
        expect(root.target).to.eql('_blank');
        expect(root.rel).to.eql('nofollow noopener noreferrer');
        expect(root.download).to.eql('sample.txt');
        expect(root.tabIndex).to.eql(3);
        expect(root.getAttribute('aria-disabled')).to.eql('true');
        for (const key of ['Enter', ' ']) {
          const event = DomMock.Keyboard.event('keydown', key, { bubbles: true, cancelable: true });
          act(() => root.dispatchEvent(event));
          expect(event.defaultPrevented).to.eql(false);
        }
        expect(keys).to.eql(['Enter', ' ']);
        expect(clicks).to.eql(0); // No synthetic button activation; the browser owns link activation.
        const event = DomMock.Mouse.event('click', {
          ctrlKey: true,
          cancelable: true,
          bubbles: true,
        });
        act(() => root.dispatchEvent(event));
        expect(clicks).to.eql(1);
        expect(event.defaultPrevented).to.eql(true);
      } finally {
        act(() => res.dispose());
      }
    });

    it('normalizes rel behavior and disabled anchor semantics across rendered cases', async () => {
      let disabledClicks = 0;
      let disabledKeys = 0;
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
          React.createElement(
            A,
            { href: 'https://example.com/c', target: '_self', rel: 'nofollow' },
            'c',
          ),
          React.createElement(
            A,
            {
              href: 'https://example.com/d',
              enabled: false,
              target: '_blank',
              download: true,
              onClick: () => disabledClicks++,
              onKeyDown: () => disabledKeys++,
            },
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

      const { event, dispatched } = DomMock.Mouse.click(list[3]);
      expect(dispatched).to.eql(false);
      expect(event.defaultPrevented).to.eql(true);
      expect(disabledClicks).to.eql(0);
      for (const attribute of ['target', 'rel', 'download']) {
        expect(list[3].hasAttribute(attribute)).to.eql(false);
      }
      for (const key of ['Enter', ' ']) {
        const event = DomMock.Keyboard.event('keydown', key, { bubbles: true, cancelable: true });
        act(() => list[3].dispatchEvent(event));
        expect(event.defaultPrevented).to.eql(true);
      }
      expect(disabledKeys).to.eql(0);

      act(() => res.dispose());
      await Promise.resolve();
    });
  });
});
