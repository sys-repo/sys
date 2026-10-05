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
import { keydown } from './u.fixture.keyboard.ts';
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

  it('retargets the cursor with plain click only after cursor mode exists', async () => {
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
    const [alpha, bravo] = boundaries(res.container);

    act(() => DomMock.Mouse.click(alpha));
    await Schedule.micro();
    expect(current).to.eql(undefined);
    expect(changes.length).to.eql(0);

    act(() => DomMock.Mouse.click(alpha, { altKey: true }));
    await Schedule.micro();
    expect(current).to.eql({ path: ['alpha'] });
    expect(document.activeElement).to.equal(root);
    expect(entryChange(changes[0]).entry).to.eql('option-click');

    act(() => root.blur());
    act(() => DomMock.Mouse.click(bravo));
    await Schedule.micro();
    expect(current).to.eql({ path: ['bravo'] });
    expect(document.activeElement).to.equal(root);
    expect(changes.length).to.eql(2);
    const retarget = entryChange(changes[1]);
    expect(retarget.entry).to.eql('click');
    expect(retarget.previous.current).to.eql({ path: ['alpha'] });
    expect(retarget.target).to.eql({ path: ['bravo'] });
    expect(retarget.command).to.eql({
      name: 'cursor:set',
      payload: { target: { path: ['bravo'] } },
    });

    act(() => root.blur());
    act(() => DomMock.Mouse.click(bravo));
    await Schedule.micro();
    expect(current).to.eql({ path: ['bravo'] });
    expect(document.activeElement).to.equal(root);
    expect(changes.length).to.eql(2);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not retarget from interactive descendants after cursor mode exists', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[{ id: 'alpha', k: 'alpha', v: <button type='button'>toggle</button> }]}
        cursor={{
          model: { current: KeyValue.Cursor.target(['alpha']) },
          onChange: (e) => changes.push(e),
        }}
      />,
      { strict: false },
    );
    const button = res.container.querySelector('button') as HTMLButtonElement;

    act(() => DomMock.Mouse.click(button));

    expect(changes.length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('retargets nested child boundaries without leaking plain click to the parent group', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    const items: t.KeyValue.Item[] = [
      { id: 'group', kind: 'group', items: [row('child')] },
      row('sibling'),
    ];
    const res = await TestReact.render(
      <KeyValue.UI
        items={items}
        cursor={{
          model: { current: KeyValue.Cursor.target(['sibling']) },
          onChange: (e) => changes.push(e),
        }}
      />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    const groupShell = root.children.item(0) as HTMLElement;
    const childShell = groupShell.querySelector(boundarySelector) as HTMLElement;

    act(() => DomMock.Mouse.click(childShell));

    expect(changes.length).to.eql(1);
    expect(entryChange(changes[0]).entry).to.eql('click');
    expect(entryChange(changes[0]).target.path).to.eql(['group', 'child']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('retargets with plain click after cursor entry in the reorder item shell path', async () => {
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
    const [alpha, bravo] = boundaries(res.container);

    act(() => DomMock.Mouse.click(alpha, { altKey: true }));
    await Schedule.micro();
    expect(current).to.eql({ path: ['alpha'] });

    act(() => root.blur());
    act(() => DomMock.Mouse.click(bravo));
    await Schedule.micro();

    expect(current).to.eql({ path: ['bravo'] });
    expect(document.activeElement).to.equal(root);
    expect(changes.length).to.eql(2);
    expect(entryChange(changes[1]).entry).to.eql('click');
    expect(entryChange(changes[1]).target.path).to.eql(['bravo']);

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

  it('enters cursor mode from a host keyboard shortcut with the hook-returned ref', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];
    let current: t.KeyValue.Cursor.Target | undefined;

    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
      const items = [row('alpha'), row('bravo')];
      current = model.current;
      const keyboardEntry = KeyValue.Cursor.Keyboard.useEntry({
        items,
        cursor: {
          model,
          onChange: (e) => {
            changes.push(e);
            setModel(e.next);
          },
        },
      });

      return (
        <div ref={keyboardEntry.ref}>
          <KeyValue.UI items={items} cursor={{ model, onChange: keyboardEntryNoop }} />
        </div>
      );
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const root = res.container.querySelector('[data-keyvalue-cursor-root]') as HTMLElement;
    const event = DomMock.Keyboard.keydownEvent('Enter', { altKey: true, cancelable: true });

    act(() => DomMock.Keyboard.fire(event));
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(true);
    expect(document.activeElement).to.equal(root);
    expect(current).to.eql({ path: ['alpha'] });
    expect(changes.length).to.eql(1);
    const change = entryChange(changes[0]);
    expect(change.entry).to.eql('option-enter');
    expect(change.reason).to.eql('cursor:entry');
    expect(change.command).to.eql({ name: 'cursor:set', payload: { target: { path: ['alpha'] } } });
    releaseGlobalEnter();
    act(() => root.blur());

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('returns and attaches a supplied host ref', async () => {
    const suppliedRef = React.createRef<HTMLDivElement>();
    let returnedRef: React.RefObject<HTMLDivElement | null> | undefined;

    const Probe: React.FC = () => {
      const keyboardEntry = KeyValue.Cursor.Keyboard.useEntry({ ref: suppliedRef });
      returnedRef = keyboardEntry.ref;
      return <div ref={keyboardEntry.ref} />;
    };

    const res = await TestReact.render(<Probe />, { strict: false });

    expect(returnedRef).to.equal(suppliedRef);
    expect(suppliedRef.current).to.not.eql(null);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not steal host keyboard entry from an active interactive element', async () => {
    const changes: t.KeyValue.Cursor.Change[] = [];

    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
      const items = [row('alpha')];
      const keyboardEntry = KeyValue.Cursor.Keyboard.useEntry({
        items,
        cursor: {
          model,
          onChange: (e) => {
            changes.push(e);
            setModel(e.next);
          },
        },
      });

      return (
        <div ref={keyboardEntry.ref}>
          <input aria-label='external input' />
          <KeyValue.UI items={items} cursor={{ model, onChange: keyboardEntryNoop }} />
        </div>
      );
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const input = res.container.querySelector('input') as HTMLInputElement;
    act(() => input.focus());

    const event = DomMock.Keyboard.keydownEvent('Enter', {
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => input.dispatchEvent(event));
    await Schedule.micro();

    expect(event.defaultPrevented).to.eql(false);
    expect(document.activeElement).to.equal(input);
    expect(changes.length).to.eql(0);
    releaseGlobalEnter(input);

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

function keyboardEntryNoop(_e: t.KeyValue.Cursor.Change) {
}

function releaseGlobalEnter(target?: EventTarget) {
  const event = DomMock.Keyboard.keyupEvent('Enter', { bubbles: true, cancelable: true });
  act(() => (target ? target.dispatchEvent(event) : DomMock.Keyboard.fire(event)));
}

function firstBoundary(container: HTMLElement) {
  return container.querySelector(boundarySelector) as HTMLElement;
}

function boundaries(container: HTMLElement) {
  return Array.from(container.querySelectorAll(boundarySelector)) as HTMLElement[];
}

function entryChange(change?: t.KeyValue.Cursor.Change): t.KeyValue.Cursor.EntryChange {
  expect(change?.reason).to.eql('cursor:entry');
  return change as t.KeyValue.Cursor.EntryChange;
}
