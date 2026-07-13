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
import { keydown } from './u.keyboard.ts';
import { KeyValue } from '../mod.ts';

const boundarySelector = '[data-keyvalue-item-boundary]';
const cursorPathSelector = '[data-keyvalue-cursor-path]';

describe('KeyValue.UI: cursor entry', () => {
  DomMock.init({ beforeEach, afterEach });

  it('keeps the default KeyValue projection free of cursor entry markers', async () => {
    const res = await TestReact.render(<KeyValue.UI items={[row('alpha')]} />, { strict: false });
    expect(res.container.querySelectorAll(boundarySelector).length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('enters cursor mode from rows with option-click by default', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI items={[row('alpha')]} cursor={{ onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );
    const shell = firstBoundary(res.container);

    DomMock.Mouse.click(shell);
    DomMock.Mouse.click(shell, { altKey: true, shiftKey: true });
    DomMock.Mouse.click(shell, { altKey: true });

    expect(changes.length).to.eql(1);
    const change = entryChange(changes[0]);
    expect(change.entry).to.eql('option-click');
    expect(change.reason).to.eql('cursor:entry');
    expect(change.target.path).to.eql(['alpha']);
    expect(change.next.current?.path).to.eql(['alpha']);
    expect(change.command).to.eql({ name: 'cursor:set', payload: { target: { path: ['alpha'] } } });

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('enters cursor mode from the focused root with Option+Enter', async () => {
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
    const root = res.container.firstElementChild as HTMLElement;
    act(() => root.focus());

    const event = keydown(root, 'Enter', { altKey: true });
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(true);
    expect(document.activeElement).to.equal(root);
    expect(current).to.eql({ path: ['alpha'] });
    expect(changes.length).to.eql(1);
    const change = entryChange(changes[0]);
    expect(change.entry).to.eql('option-enter');
    expect(change.target).to.eql({ path: ['alpha'] });

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not enter cursor mode from keyboard when row entry is disabled', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        cursor={{ entry: false, onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    act(() => root.focus());

    const event = keydown(root, 'Enter', { altKey: true });

    expect(event.defaultPrevented).to.eql(false);
    expect(changes.length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('can enter cursor mode from a plain click when configured', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        cursor={{ entry: 'click', onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );

    DomMock.Mouse.click(firstBoundary(res.container));

    expect(changes.length).to.eql(1);
    const change = entryChange(changes[0]);
    expect(change.entry).to.eql('click');
    expect(change.target.path).to.eql(['alpha']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not enter cursor mode when row entry is disabled', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        cursor={{ entry: false, onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );

    DomMock.Mouse.click(firstBoundary(res.container), { altKey: true });

    expect(changes.length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not emit cursor entry for missing or blank item identities', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const items: t.KeyValue.Item[] = [
      row(' '),
      { k: 'missing', v: 'missing' },
    ];
    const res = await TestReact.render(
      <KeyValue.UI items={items} cursor={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );

    res.container.querySelectorAll(boundarySelector).forEach((el) => DomMock.Mouse.click(el));

    expect(changes.length).to.eql(0);
    expect(res.container.querySelectorAll(cursorPathSelector).length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not emit cursor entry for duplicate direct item identities', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const items: t.KeyValue.Item[] = [row('alpha'), row('alpha')];
    const res = await TestReact.render(
      <KeyValue.UI items={items} cursor={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );

    res.container.querySelectorAll(boundarySelector).forEach((el) => DomMock.Mouse.click(el));

    expect(changes.length).to.eql(0);
    expect(res.container.querySelectorAll(cursorPathSelector).length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('places the cursor on nested child boundaries without leaking the click to the parent group', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const items: t.KeyValue.Item[] = [
      { id: 'group', kind: 'group', items: [row('child')] },
    ];
    const res = await TestReact.render(
      <KeyValue.UI items={items} cursor={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    const groupShell = root.children.item(0) as HTMLElement;
    const childShell = groupShell.querySelector(boundarySelector) as HTMLElement;

    DomMock.Mouse.click(childShell);
    DomMock.Mouse.click(groupShell);

    expect(changes.map((e) => entryChange(e).target.path)).to.eql([['group', 'child'], ['group']]);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not steal clicks from interactive row descendants', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const items: t.KeyValue.Item[] = [
      { id: 'alpha', k: 'alpha', v: <button>toggle</button> },
    ];
    const res = await TestReact.render(
      <KeyValue.UI items={items} cursor={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );
    const button = res.container.querySelector('button') as HTMLButtonElement;

    DomMock.Mouse.click(button);

    expect(changes.length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('supports cursor entry in the reorder item shell path', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha'), row('bravo')]}
        reorder={{ onChange: () => undefined }}
        cursor={{ entry: 'click', onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );

    DomMock.Mouse.click(firstBoundary(res.container));

    expect(changes.length).to.eql(1);
    expect(entryChange(changes[0]).target.path).to.eql(['alpha']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('enters cursor mode from the focused reorder root with Option+Enter', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    let current: t.KeyValue.Cursor.Target | undefined;

    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
      current = model.current;
      return (
        <KeyValue.UI
          items={[row('alpha'), row('bravo')]}
          reorder={{ onChange: () => undefined }}
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
    const root = res.container.firstElementChild as HTMLElement;
    expect(root.dataset.keyvalueCursorRoot).to.eql('true');
    expect(root.tabIndex).to.eql(0);

    act(() => root.focus());
    const event = keydown(root, 'Enter', { altKey: true });
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(true);
    expect(document.activeElement).to.equal(root);
    expect(current).to.eql({ path: ['alpha'] });
    expect(changes.length).to.eql(1);
    expect(entryChange(changes[0]).entry).to.eql('option-enter');

    act(() => res.dispose());
    await Schedule.micro();
  });
});

/**
 * Helpers:
 */

function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}

function firstBoundary(container: HTMLElement) {
  return container.querySelector(boundarySelector) as HTMLElement;
}

function entryChange(change?: t.KeyValue.Cursor.Change): t.KeyValue.Cursor.EntryChange {
  expect(change?.reason).to.eql('cursor:entry');
  return change as t.KeyValue.Cursor.EntryChange;
}
