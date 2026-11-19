import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { BulletList } from '../mod.ts';
import { button, compatibilityMouse, key, mouse, touch } from '../../Button/-test/u.fixture.ts';

describe('BulletList activation', () => {
  DomMock.init({ beforeAll, afterAll });

  it('primary release → one activation with release-time modifiers', async () => {
    const events: unknown[] = [];
    const res = await TestReact.render(
      <BulletList.UI items={[{ id: 'run' }]} onActivate={(e) => events.push(e)} />,
    );
    try {
      const root = button(res.container);
      mouse(root, 'mousedown', { shiftKey: true });
      expect(events).to.eql([]);
      mouse(root, 'mouseup', { ctrlKey: true });
      mouse(root, 'click');
      expect(events).to.eql([{
        id: 'run',
        modifiers: { ctrl: true, shift: false, meta: false, alt: false },
        is: { command: true, modified: true },
      }]);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('keyboard and assistive input → the same activation without pointer input', async () => {
    const events: unknown[] = [];
    const res = await TestReact.render(
      <BulletList.UI items={[{ id: 'run' }]} onActivate={(e) => events.push(e)} />,
    );
    try {
      const root = button(res.container);
      React.act(() => root.focus());
      for (const value of ['Enter', ' ']) {
        key(root, 'keydown', value, { shiftKey: true });
        key(root, 'keydown', value, { repeat: true });
        key(root, 'keyup', value, { shiftKey: true });
      }
      React.act(() => root.click());
      expect(events).to.eql([1, 2, 3].map(() => ({
        id: 'run',
        modifiers: { ctrl: false, shift: false, meta: false, alt: false },
        is: { command: false, modified: false },
      })));
      for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
        for (const value of ['Enter', ' ']) {
          key(root, 'keydown', value, { [modifier]: true });
          key(root, 'keyup', value, { [modifier]: true });
        }
      }
      expect(events.length).to.eql(3);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('unavailable or canceled input → no activation; touch release → one activation', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <BulletList.UI
        items={[{ id: 'run' }, { id: 'disabled', enabled: false }]}
        onActivate={(e) => events.push(e.id)}
      />,
    );
    try {
      const root = button(res.container);
      const disabled = res.container.querySelectorAll<HTMLElement>('[role="button"]')[1];
      mouse(root, 'mouseup');
      for (const target of [root, disabled]) {
        mouse(target, 'mousedown', { button: 2 });
        mouse(target, 'mouseup', { button: 2 });
      }
      mouse(disabled, 'mousedown');
      mouse(disabled, 'mouseup');
      React.act(() => disabled.click());
      mouse(root, 'mousedown');
      mouse(root, 'mouseout', { relatedTarget: document.body });
      mouse(root, 'mouseup');
      root.addEventListener('mousedown', (e) => e.preventDefault(), { once: true });
      mouse(root, 'mousedown');
      mouse(root, 'mouseup');
      touch(root, 'touchstart');
      touch(root, 'touchcancel');
      touch(root, 'touchend');
      expect(events).to.eql([]);
      touch(root, 'touchstart');
      expect(events).to.eql([]);
      touch(root, 'touchend');
      for (const type of ['mousedown', 'mouseup', 'click']) compatibilityMouse(root, type);
      expect(events).to.eql(['run']);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
