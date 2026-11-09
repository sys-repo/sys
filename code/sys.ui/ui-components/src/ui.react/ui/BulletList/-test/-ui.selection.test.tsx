import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { type t } from '../common.ts';
import { BulletList } from '../mod.ts';
import { key } from '../../Button/-test/u.fixture.ts';

describe('BulletList controlled selection', () => {
  DomMock.init({ beforeAll, afterAll });

  it('activation waits for caller props → accessible and painted selection change together', async () => {
    let update!: (selected: t.BulletList.Selected | undefined) => void;
    const events: string[] = [];
    function Root() {
      const [selected, setSelected] = React.useState<t.BulletList.Selected | undefined>([]);
      update = setSelected;
      return (
        <BulletList.UI
          selected={selected}
          items={[{ id: 'a' }, { id: '', label: 'Empty ID' }]}
          onActivate={({ id }) => events.push(id)}
        />
      );
    }
    const res = await TestReact.render(<Root />);
    try {
      const [a, empty] = res.container.querySelectorAll<HTMLElement>('[role="button"]');
      const before = paint(a);
      expect(states(res.container)).to.eql(['false', 'false']);
      React.act(() => a.click());
      expect(events).to.eql(['a']);
      expect(states(res.container)).to.eql(['false', 'false']);
      expect(paint(a)).to.eql(before);

      React.act(() => update('a'));
      expect(states(res.container)).to.eql(['true', 'false']);
      expect(paint(a)).not.to.eql(before);
      React.act(() => update(['a', '']));
      expect(states(res.container)).to.eql(['true', 'true']);
      React.act(() => update(''));
      expect(states(res.container)).to.eql(['false', 'true']);
      expect(paint(a)).to.eql(before);
      expect(paint(empty)).not.to.eql(before);
      React.act(() => update([]));
      expect(states(res.container)).to.eql(['false', 'false']);
      React.act(() => update(undefined));
      expect(states(res.container)).to.eql([null, null]);
      React.act(() => empty.click());
      expect(events).to.eql(['a', '']);
      expect(states(res.container)).to.eql([null, null]);
      expect(paint(empty)).to.eql(before);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('semantic list → inert content cells and hidden markers, with ordinary button Tab stops', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <BulletList.UI
        columns={2}
        items={[
          { id: 'literal', label: 'Run `foo`' },
          { kind: 'content', key: 'help', render: () => <a href='#help'>Help</a> },
          { id: 'fallback' },
        ]}
        onActivate={({ id }) => events.push(id)}
      />,
    );
    try {
      const list = res.container.querySelector('ul')!;
      expect(list.getAttribute('role')).to.eql('list');
      expect([...list.children].map((el) => el.tagName)).to.eql(['LI', 'LI', 'LI']);
      const buttons = [...list.querySelectorAll<HTMLElement>('[role="button"]')];
      expect(buttons.map((el) => el.textContent)).to.eql(['Run `foo`', 'fallback']);
      expect(buttons.map((el) => el.tabIndex)).to.eql([0, 0]);
      expect(list.querySelectorAll('[tabindex]').length).to.eql(2);
      expect(list.querySelectorAll('[aria-hidden="true"]').length).to.eql(2);
      expect(list.querySelector('code')).to.eql(null);
      expect(list.children[1].querySelector('[role="button"]')).to.eql(null);
      React.act(() => list.querySelector('a')!.click());
      expect(events).to.eql([]);
      for (const el of buttons) {
        React.act(() => el.click());
      }
      expect(events).to.eql(['literal', 'fallback']);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('caller-controlled membership → Enter/Space toggle without a modifier', async () => {
    function Root() {
      const [selected, setSelected] = React.useState<readonly string[]>([]);
      return (
        <BulletList.UI
          items={[{ id: 'a' }, { id: 'b' }]}
          selected={selected}
          onActivate={({ id }) => setSelected(BulletList.toggle(selected, id))}
        />
      );
    }
    const res = await TestReact.render(<Root />);
    try {
      const [a, b] = res.container.querySelectorAll<HTMLElement>('[role="button"]');
      for (const [el, input] of [[a, 'Enter'], [b, ' '], [a, ' ']] as const) {
        React.act(() => el.focus());
        key(el, 'keydown', input);
        key(el, 'keyup', input);
      }
      expect(states(res.container)).to.eql(['false', 'true']);
    } finally {
      React.act(() => res.dispose());
    }
  });
});

/**
 * Helpers:
 */
function states(container: HTMLElement) {
  return [...container.querySelectorAll('[role="button"]')].map((el) =>
    el.getAttribute('aria-pressed')
  );
}

function paint(button: HTMLElement) {
  const glyph = button.querySelector('[aria-hidden="true"] > div > div')!;
  return button.ownerDocument.defaultView!.getComputedStyle(glyph).backgroundColor;
}
