import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import type { t } from '../common.ts';
import { KeyValue } from '../mod.ts';
import { firstChild, row, selectElement, target } from './u.fixture.cursor.ts';
import { keydown, keyup } from './u.fixture.keyboard.ts';

describe('KeyValue.ActionButton: shared Button integration', () => {
  // Generated stylesheet rules share the document's lifetime.
  DomMock.init({ beforeAll, afterAll });

  it('compact focus → 1px offset with the shared 2px stroke', async () => {
    const res = await TestReact.render(<KeyValue.ActionButton label='Run' />);
    try {
      const action = selectElement(res.container, '[role="button"]');
      const style = action.ownerDocument.defaultView!.getComputedStyle(action);
      expect(style.getPropertyValue('--sys-button-focus-offset').trim()).to.eql('1px');
      expect(style.getPropertyValue('--sys-button-focus-width').trim()).to.eql('2px');
    } finally {
      React.act(() => res.dispose());
    }
  });

  for (const reorder of [false, true]) {
    const layout = reorder ? 'reorder' : 'static';
    it(`${layout}: keyboard action → pressed feedback, without cursor movement`, async () => {
      let actions = 0;
      const changes: t.KeyValue.Cursor.Change[] = [];
      const value = <KeyValue.ActionButton label='Run' onClick={() => actions++} />;
      const items = [{ id: 'alpha', k: 'Action', v: value }, row('bravo')];
      const initial: t.KeyValue.Cursor.Model = { current: target('alpha') };
      const Probe = () => {
        const [model, setModel] = React.useState(initial);
        return (
          <KeyValue.UI
            items={items}
            reorder={reorder ? { onChange: () => {} } : undefined}
            cursor={{
              model,
              onChange: (e) => {
                changes.push(e);
                setModel(e.next);
              },
            }}
          />
        );
      };
      const res = await TestReact.render(<Probe />);
      try {
        const root = firstChild(res.container);
        const action = selectElement(res.container, '[role="button"]');
        const content = selectElement(action, ':scope > div');
        const view = action.ownerDocument.defaultView!;
        expect(action.tabIndex).to.eql(0);
        React.act(() => action.focus());
        expect(document.activeElement).to.equal(action);

        for (const input of ['Enter', ' ']) {
          const before = actions;
          keydown(action, input);
          const held = view.getComputedStyle(content).transform;
          expect(held).to.eql('translateX(0px) translateY(1px)');
          expect(actions).to.eql(before + (input === 'Enter' ? 1 : 0));

          keyup(action, input);
          const released = view.getComputedStyle(content).transform || 'none';
          expect(released).to.eql('none');
          expect(actions).to.eql(before + 1);
          expect(changes).to.eql([]);
        }
        expect(actions).to.eql(2);

        const arrow = keydown(action, 'ArrowDown');
        expect(arrow.defaultPrevented).to.eql(false);
        expect(changes).to.eql([]);
        expect(document.activeElement).to.equal(action);

        React.act(() => root.focus());
        const navigation = keydown(root, 'ArrowDown');
        const paths = changes.map((e) => e.next.current?.path);
        expect(navigation.defaultPrevented).to.eql(true);
        expect(paths).to.eql([['bravo']]);
        expect(actions).to.eql(2);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('disabled action → removed from tab order and unable to activate', async () => {
    let actions = 0;
    const onClick = () => actions++;
    const value = <KeyValue.ActionButton label='Run' enabled={false} onClick={onClick} />;
    const items = [{ id: 'action', k: 'Action', v: value }];
    const res = await TestReact.render(<KeyValue.UI items={items} />);
    try {
      const action = selectElement(res.container, '[role="button"]');
      expect(action.tabIndex).to.eql(-1);
      expect(action.getAttribute('aria-disabled')).to.eql('true');

      React.act(() => action.focus());
      expect(document.activeElement).to.equal(action);
      for (const input of ['Enter', ' ']) {
        keydown(action, input);
        keyup(action, input);
      }
      expect(actions).to.eql(0);

      React.act(() => {
        DomMock.Mouse.activate(action);
        action.click();
      });
      expect(actions).to.eql(0);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
