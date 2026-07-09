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
const focusPathSelector = '[data-keyvalue-focus-path]';

describe('KeyValue.UI: focus entry', () => {
  DomMock.init({ beforeEach, afterEach });

  it('keeps the default KeyValue projection free of focus entry markers', async () => {
    const res = await TestReact.render(<KeyValue.UI items={[row('alpha')]} />, { strict: false });
    expect(res.container.querySelectorAll(boundarySelector).length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('enters focus from rows with option-click by default', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI items={[row('alpha')]} focus={{ onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );
    const shell = firstBoundary(res.container);

    DomMock.Mouse.click(shell);
    DomMock.Mouse.click(shell, { altKey: true, shiftKey: true });
    DomMock.Mouse.click(shell, { altKey: true });

    expect(changes.length).to.eql(1);
    expect(changes[0].entry).to.eql('option-click');
    expect(changes[0].reason).to.eql('focus:entry');
    expect(changes[0].ref.path).to.eql(['alpha']);
    expect(changes[0].next.active?.path).to.eql(['alpha']);
    expect(changes[0].command).to.eql({ name: 'focus:set', payload: { ref: { path: ['alpha'] } } });

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('can enter focus from a plain click when configured', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        focus={{ entry: 'click', onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );

    DomMock.Mouse.click(firstBoundary(res.container));

    expect(changes.length).to.eql(1);
    expect(changes[0].entry).to.eql('click');
    expect(changes[0].ref.path).to.eql(['alpha']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not enter focus when row entry is disabled', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        focus={{ entry: false, onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );

    DomMock.Mouse.click(firstBoundary(res.container), { altKey: true });

    expect(changes.length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not emit focus entry for missing or blank item identities', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const items: t.KeyValue.Item[] = [
      row(' '),
      { k: 'missing', v: 'missing' },
    ];
    const res = await TestReact.render(
      <KeyValue.UI items={items} focus={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );

    res.container.querySelectorAll(boundarySelector).forEach((el) => DomMock.Mouse.click(el));

    expect(changes.length).to.eql(0);
    expect(res.container.querySelectorAll(focusPathSelector).length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not emit focus entry for duplicate direct item identities', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const items: t.KeyValue.Item[] = [row('alpha'), row('alpha')];
    const res = await TestReact.render(
      <KeyValue.UI items={items} focus={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );

    res.container.querySelectorAll(boundarySelector).forEach((el) => DomMock.Mouse.click(el));

    expect(changes.length).to.eql(0);
    expect(res.container.querySelectorAll(focusPathSelector).length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('focuses nested child boundaries without leaking the click to the parent group', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const items: t.KeyValue.Item[] = [
      { id: 'group', kind: 'group', items: [row('child')] },
    ];
    const res = await TestReact.render(
      <KeyValue.UI items={items} focus={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    const groupShell = root.children.item(0) as HTMLElement;
    const childShell = groupShell.querySelector(boundarySelector) as HTMLElement;

    DomMock.Mouse.click(childShell);
    DomMock.Mouse.click(groupShell);

    expect(changes.map((e) => e.ref.path)).to.eql([['group', 'child'], ['group']]);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not steal clicks from interactive row descendants', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const items: t.KeyValue.Item[] = [
      { id: 'alpha', k: 'alpha', v: <button>toggle</button> },
    ];
    const res = await TestReact.render(
      <KeyValue.UI items={items} focus={{ entry: 'click', onChange: (e) => changes.push(e) }} />,
      { strict: false },
    );
    const button = res.container.querySelector('button') as HTMLButtonElement;

    DomMock.Mouse.click(button);

    expect(changes.length).to.eql(0);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('supports focus entry in the reorder item shell path', async () => {
    const changes: t.KeyValue.Focus.Change[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha'), row('bravo')]}
        reorder={{ onChange: () => undefined }}
        focus={{ entry: 'click', onChange: (e) => changes.push(e) }}
      />,
      { strict: false },
    );

    DomMock.Mouse.click(firstBoundary(res.container));

    expect(changes.length).to.eql(1);
    expect(changes[0].ref.path).to.eql(['alpha']);

    act(() => res.dispose());
    await Schedule.micro();
  });
});

/**
 * Helpers:
 */

function row(id: string): t.KeyValue.Row {
  return { id, k: id, v: id };
}

function firstBoundary(container: HTMLElement) {
  return container.querySelector(boundarySelector) as HTMLElement;
}
