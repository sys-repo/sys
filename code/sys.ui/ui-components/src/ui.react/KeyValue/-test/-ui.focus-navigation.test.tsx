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
import { KeyValue } from '../mod.ts';

const boundarySelector = '[data-keyvalue-item-boundary]';

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

describe('KeyValue.UI: focus navigation', () => {
  DomMock.init({ beforeEach, afterEach });

  it('focuses the navigation root on row entry and navigates from keyboard input', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];

    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Focus.Model>({});
      return (
        <KeyValue.UI
          items={[row('alpha'), row('bravo')]}
          focus={{
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
    expect(changes.map((e) => e.reason)).to.eql(['focus:entry', 'focus:navigation']);
    expect(entryChange(changes[0]).next.active?.path).to.eql(['alpha']);
    expect(navigationChange(changes[1]).next.active?.path).to.eql(['bravo']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('moves a controlled focus model through sibling and nested scopes', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    let active: t.ObjectPath | undefined;

    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Focus.Model>({ active: ref('group') });
      active = model.active?.path;
      return (
        <KeyValue.UI
          items={items}
          focus={{
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
    expect(active).to.eql(['group', 'bravo.one']);

    keydown(root, 'ArrowDown');
    await Schedule.micro();
    expect(active).to.eql(['group', 'group.two']);

    keydown(root, 'Enter');
    await Schedule.micro();
    expect(active).to.eql(['group', 'group.two', 'two.a']);

    keydown(root, 'Escape');
    await Schedule.micro();
    expect(active).to.eql(['group', 'group.two']);

    keydown(root, 'Escape');
    await Schedule.micro();
    expect(active).to.eql(['group']);

    keydown(root, 'ArrowDown');
    await Schedule.micro();
    expect(active).to.eql(['charlie']);

    keydown(root, 'Escape');
    await Schedule.micro();
    expect(active).to.eql(undefined);

    expect(changes.map((e) => navigationChange(e).command.name)).to.eql([
      'focus:enter',
      'focus:next',
      'focus:enter',
      'focus:exit',
      'focus:exit',
      'focus:next',
      'focus:exit',
    ]);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('ignores keyboard navigation without active focus or from protected descendants', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[{ id: 'alpha', k: 'alpha', v: <button>toggle</button> }, row('bravo')]}
        focus={{ model: {}, onChange: (e) => changes.push(e) }}
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

  it('can disable keyboard navigation while keeping focus entry separate', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha'), row('bravo')]}
        focus={{
          model: { active: ref('alpha') },
          navigation: false,
          onChange: (e) => changes.push(e),
        }}
      />,
      { strict: false },
    );
    const root = firstChild(res.container);
    const event = keydown(root, 'ArrowDown');

    expect(root.getAttribute('data-keyvalue-focus-root')).to.eql(null);
    expect(event.defaultPrevented).to.eql(false);
    expect(changes.length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('supports keyboard navigation in the reorder root path', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha'), row('bravo')]}
        reorder={{ onChange: () => undefined }}
        focus={{ model: { active: ref('alpha') }, onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );

    keydown(firstChild(res.container), 'ArrowDown');

    expect(changes.length).to.eql(1);
    expect(navigationChange(changes[0]).next.active?.path).to.eql(['bravo']);

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

function ref(...path: t.ObjectPath): t.KeyValue.Focus.Ref {
  return KeyValue.Focus.ref(path);
}

function firstChild(container: HTMLElement) {
  return container.firstElementChild as HTMLElement;
}

function firstBoundary(container: HTMLElement) {
  return container.querySelector(boundarySelector) as HTMLElement;
}

function keydown(el: EventTarget, key: string, init: KeyboardEventInit = {}) {
  const event = DomMock.Keyboard.keydownEvent(key, { bubbles: true, cancelable: true, ...init });
  act(() => el.dispatchEvent(event));
  return event;
}

function entryChange(change: t.KeyValue.Focus.Change | undefined): t.KeyValue.Focus.EntryChange {
  expect(change?.reason).to.eql('focus:entry');
  return change as t.KeyValue.Focus.EntryChange;
}

function navigationChange(change: t.KeyValue.Focus.Change | undefined): t.KeyValue.Focus.NavigationChange {
  expect(change?.reason).to.eql('focus:navigation');
  return change as t.KeyValue.Focus.NavigationChange;
}
