import React from 'react';

import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  Schedule,
  type t,
  TestReact,
} from '../../../-test.ts';
import {
  currentBoundary,
  currentCells,
  entryChange,
  firstBoundary,
  firstChild,
  navigationChange,
  row,
  target,
  visibleBackground,
} from './u.cursor.ts';
import { keydown } from './u.keyboard.ts';
import { KeyValue } from '../mod.ts';

const items: t.KeyValue.Item[] = [
  row('alpha'),
  {
    id: 'group',
    kind: 'group',
    items: [
      row('bravo.one'),
      {
        id: 'group.two',
        kind: 'group',
        items: [row('two.a'), row('two.b')],
      },
    ],
  },
  row('charlie'),
];

describe('KeyValue.UI: cursor navigation', () => {
  DomMock.init({ beforeEach, afterEach });

  describe('entry and sibling movement', () => {
    it('focuses the navigation root on row entry and navigates from keyboard input', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];

      const Probe: React.FC = () => {
        const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
        return (
          <KeyValue.UI
            items={[row('alpha'), row('bravo')]}
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

      const res = await TestReact.render(<Probe />, { strict: false });
      const root = firstChild(res.container);
      act(() => DomMock.Mouse.click(firstBoundary(res.container), { altKey: true }));
      await Schedule.micro();

      expect(document.activeElement).to.equal(root);
      expect(window.getComputedStyle(root).outlineStyle).to.eql('none');

      const event = keydown(root, 'ArrowDown');
      await Schedule.micro();

      expect(event.defaultPrevented).to.eql(true);
      expect(changes.map((e) => e.reason)).to.eql(['cursor:entry', 'cursor:navigation']);
      expect(entryChange(changes[0]).next.current?.path).to.eql(['alpha']);
      expect(navigationChange(changes[1]).next.current?.path).to.eql(['bravo']);

      act(() => res.dispose());
      await Schedule.micro();
    });
  });

  describe('key/value lanes', () => {
    it('navigates key/value cursor lanes from keyboard input', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];
      let current: t.KeyValue.Cursor.Target | undefined;

      const Probe: React.FC = () => {
        const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({
          current: target('alpha'),
        });
        current = model.current;
        return (
          <KeyValue.UI
            items={[row('alpha'), row('bravo'), { id: 'title', kind: 'title', v: 'Title' }]}
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

      const res = await TestReact.render(<Probe />, { strict: false });
      const root = firstChild(res.container);

      const plainLaneEvent = keydown(root, 'ArrowLeft');
      await Schedule.micro();
      expect(plainLaneEvent.defaultPrevented).to.eql(false);
      expect(current).to.eql({ path: ['alpha'] });

      keydown(root, 'ArrowLeft', { altKey: true });
      await Schedule.micro();
      expect(current).to.eql({ path: ['alpha'], part: 'key' });
      expect(currentBoundary(res.container).getAttribute('data-keyvalue-cursor-current-part')).to
        .eql('key');

      keydown(root, 'ArrowRight', { altKey: true });
      await Schedule.micro();
      expect(current).to.eql({ path: ['alpha'], part: 'value' });
      expect(currentBoundary(res.container).getAttribute('data-keyvalue-cursor-current-part')).to
        .eql('value');

      keydown(root, 'ArrowDown');
      await Schedule.micro();
      expect(current).to.eql({ path: ['bravo'], part: 'value' });

      keydown(root, 'ArrowDown');
      await Schedule.micro();
      expect(current).to.eql({ path: ['title'] });

      keydown(root, 'Escape');
      await Schedule.micro();
      expect(current).to.eql(undefined);

      expect(changes.map((e) => navigationChange(e).command.name)).to.eql([
        'cursor:left',
        'cursor:right',
        'cursor:next',
        'cursor:next',
        'cursor:exit',
      ]);

      act(() => res.dispose());
      await Schedule.micro();
    });

    it('enters value lane from focused root with Option+ArrowRight, then moves lanes with Option+ArrowLeft', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];
      let current: t.KeyValue.Cursor.Target | undefined;

      const Probe: React.FC = () => {
        const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
        current = model.current;
        return (
          <KeyValue.UI
            items={[row('alpha'), row('bravo')]}
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

      const res = await TestReact.render(<Probe />, { strict: false });
      const root = firstChild(res.container);
      act(() => root.focus());

      const entryEvent = keydown(root, 'ArrowRight', { altKey: true });
      await Schedule.micro();
      expect(entryEvent.defaultPrevented).to.eql(true);
      expect(current).to.eql({ path: ['alpha'], part: 'value' });
      expect(currentBoundary(res.container).getAttribute('data-keyvalue-cursor-current-part')).to
        .eql('value');
      expect(currentCells(res.container).value.getAttribute('data-keyvalue-cursor-cell-current'))
        .to.eql('true');
      expect(currentCells(res.container).key.getAttribute('data-keyvalue-cursor-cell-current')).to
        .eql(null);
      expect(visibleBackground(currentCells(res.container).value)).to.eql(true);

      const laneEvent = keydown(root, 'ArrowLeft', { altKey: true });
      await Schedule.micro();
      expect(laneEvent.defaultPrevented).to.eql(true);
      expect(current).to.eql({ path: ['alpha'], part: 'key' });
      expect(currentBoundary(res.container).getAttribute('data-keyvalue-cursor-current-part')).to
        .eql('key');
      expect(currentCells(res.container).key.getAttribute('data-keyvalue-cursor-cell-current')).to
        .eql('true');
      expect(currentCells(res.container).value.getAttribute('data-keyvalue-cursor-cell-current'))
        .to.eql(null);
      expect(visibleBackground(currentCells(res.container).key)).to.eql(true);

      expect(entryChange(changes[0]).entry).to.eql('option-arrow-right');
      expect(navigationChange(changes[1]).command.name).to.eql('cursor:left');

      act(() => res.dispose());
      await Schedule.micro();
    });
  });

  describe('block edges', () => {
    it('moves by hr-delimited block edges from keyboard input', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];
      let current: t.KeyValue.Cursor.Target | undefined;

      const Probe: React.FC = () => {
        const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({
          current: KeyValue.Cursor.target(['alpha'], 'value'),
        });
        current = model.current;
        return (
          <KeyValue.UI
            items={[
              row('alpha'),
              { kind: 'hr' },
              row('bravo'),
              row('charlie'),
              { kind: 'hr' },
              { id: 'title', kind: 'title', v: 'Title' },
              row('delta'),
            ]}
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

      const res = await TestReact.render(<Probe />, { strict: false });
      const root = firstChild(res.container);

      const blockDown = keydown(root, 'ArrowDown', { altKey: true });
      await Schedule.micro();
      expect(blockDown.defaultPrevented).to.eql(true);
      expect(current).to.eql({ path: ['bravo'], part: 'value' });

      const plainDown = keydown(root, 'ArrowDown');
      await Schedule.micro();
      expect(plainDown.defaultPrevented).to.eql(true);
      expect(current).to.eql({ path: ['charlie'], part: 'value' });

      keydown(root, 'ArrowDown', { altKey: true });
      await Schedule.micro();
      expect(current).to.eql({ path: ['title'] });

      keydown(root, 'ArrowUp', { altKey: true });
      await Schedule.micro();
      expect(current).to.eql({ path: ['charlie'] });

      keydown(root, 'ArrowUp', { altKey: true });
      await Schedule.micro();
      expect(current).to.eql({ path: ['bravo'] });

      expect(changes.map((e) => navigationChange(e).command.name)).to.eql([
        'cursor:next-block',
        'cursor:next',
        'cursor:next-block',
        'cursor:previous-block',
        'cursor:previous-block',
      ]);

      act(() => res.dispose());
      await Schedule.micro();
    });
  });

  describe('groups and scopes', () => {
    it('moves a controlled cursor model through sibling and nested scopes', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];
      let current: t.KeyValue.Cursor.Target | undefined;

      const Probe: React.FC = () => {
        const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({
          current: target('group'),
        });
        current = model.current;
        return (
          <KeyValue.UI
            items={items}
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

      const res = await TestReact.render(<Probe />, { strict: false });
      const root = firstChild(res.container);

      keydown(root, 'Enter');
      await Schedule.micro();
      expect(current).to.eql({ path: ['group', 'bravo.one'] });

      keydown(root, 'ArrowRight', { altKey: true });
      await Schedule.micro();
      expect(current).to.eql({ path: ['group', 'bravo.one'], part: 'value' });

      keydown(root, 'Escape');
      await Schedule.micro();
      expect(current).to.eql({ path: ['group', 'bravo.one'] });

      keydown(root, 'ArrowDown');
      await Schedule.micro();
      expect(current).to.eql({ path: ['group', 'group.two'] });

      keydown(root, 'Enter');
      await Schedule.micro();
      expect(current).to.eql({ path: ['group', 'group.two', 'two.a'] });

      keydown(root, 'Escape');
      await Schedule.micro();
      expect(current).to.eql({ path: ['group', 'group.two'] });

      keydown(root, 'Escape');
      await Schedule.micro();
      expect(current).to.eql({ path: ['group'] });

      keydown(root, 'ArrowDown');
      await Schedule.micro();
      expect(current).to.eql({ path: ['charlie'] });

      keydown(root, 'Escape');
      await Schedule.micro();
      expect(current).to.eql(undefined);

      expect(changes.map((e) => navigationChange(e).command.name)).to.eql([
        'cursor:enter',
        'cursor:right',
        'cursor:exit',
        'cursor:next',
        'cursor:enter',
        'cursor:exit',
        'cursor:exit',
        'cursor:next',
        'cursor:exit',
      ]);

      act(() => res.dispose());
      await Schedule.micro();
    });
  });

  describe('guards', () => {
    it('ignores keyboard navigation without current cursor or from protected descendants', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];
      const res = await TestReact.render(
        <KeyValue.UI
          items={[{ id: 'alpha', k: 'alpha', v: <button>toggle</button> }, row('bravo')]}
          cursor={{ model: {}, onChange: (e) => changes.push(e) }}
        />,
        { strict: false },
      );
      const root = firstChild(res.container);
      const button = res.container.querySelector('button') as HTMLButtonElement;

      const empty = keydown(root, 'ArrowDown');
      const modified = keydown(root, 'ArrowDown', { altKey: true });
      const interactive = keydown(button, 'ArrowDown');

      expect(empty.defaultPrevented).to.eql(false);
      expect(modified.defaultPrevented).to.eql(false);
      expect(interactive.defaultPrevented).to.eql(false);
      expect(changes.length).to.eql(0);

      act(() => res.dispose());
      await Schedule.micro();
    });

    it('can disable keyboard navigation while keeping cursor entry separate', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];
      const res = await TestReact.render(
        <KeyValue.UI
          items={[row('alpha'), row('bravo')]}
          cursor={{
            model: { current: target('alpha') },
            navigation: false,
            onChange: (e) => changes.push(e),
          }}
        />,
        { strict: false },
      );
      const root = firstChild(res.container);
      const event = keydown(root, 'ArrowDown');

      expect(root.getAttribute('data-keyvalue-cursor-root')).to.eql(null);
      expect(event.defaultPrevented).to.eql(false);
      expect(changes.length).to.eql(0);

      act(() => res.dispose());
      await Schedule.micro();
    });
  });

  describe('reorder root parity', () => {
    it('supports keyboard navigation in the reorder root path', async () => {
      const changes: t.KeyValue.Cursor.Change[] = [];
      const res = await TestReact.render(
        <KeyValue.UI
          items={[row('alpha'), { kind: 'hr' }, row('bravo'), row('charlie')]}
          reorder={{ onChange: () => undefined }}
          cursor={{ model: { current: target('alpha') }, onChange: (e) => changes.push(e) }}
        />,
        { strict: false },
      );

      keydown(firstChild(res.container), 'ArrowDown', { altKey: true });

      expect(changes.length).to.eql(1);
      expect(navigationChange(changes[0]).command.name).to.eql('cursor:next-block');
      expect(navigationChange(changes[0]).next.current?.path).to.eql(['bravo']);

      act(() => res.dispose());
      await Schedule.micro();
    });
  });
});
