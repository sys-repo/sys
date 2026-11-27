import { useState } from 'react';
import { within } from '@testing-library/react';
import { EventsView } from '@sys/ui-components/react/event';
import { KeyValue } from '@sys/ui-components/react/key-value';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  EsmAssert,
  expect,
  it,
  Path,
  TestReact,
} from '../../../-test.ts';

const observed = { kind: 'sample:observed' } as const;
const finished = { kind: 'sample:finished', result: 'Complete' } as const;
const button = 'button, [role="button"]';
const number = new Intl.NumberFormat();

/** Read the content supplied by the test renderer, independent of the viewer's row markup. */
function rendered(root: Element) {
  return [...root.querySelectorAll('em')].map((el) => el.textContent);
}

describe('EventsView', () => {
  DomMock.init({ beforeAll, afterAll });

  it('label and count disclose the same bounded window of supplied occurrences', async () => {
    const older = Array.from({ length: 997 }, () => ({ kind: 'sample:ready' } as const));
    const items = Object.freeze([...older, observed, observed, finished]);
    using res = await TestReact.render(
      <EventsView.UI
        items={items}
        tail={3}
        renderItem={(event) => (
          <em>{event.kind === 'sample:finished' ? event.result : event.kind}</em>
        )}
      />,
    );
    const { container } = res;
    const label = container.querySelector<HTMLElement>('[aria-expanded][aria-controls]')!;
    const count = [...container.querySelectorAll<HTMLElement>(button)]
      .find((el) => el.textContent === number.format(items.length))!;
    expect(rendered(container)).to.eql(['Complete']); // Latest supplied event, no history yet.
    act(() => label.click());
    const panel = document.getElementById(label.getAttribute('aria-controls')!)!;
    expect(label.getAttribute('aria-expanded')).to.eql('true');
    expect(count.textContent).to.include(`${number.format(3)} of ${number.format(items.length)}`);
    expect(rendered(panel)).to.eql(['Complete', 'sample:observed', 'sample:observed']);
    expect(container.querySelector('[role="status"], [aria-live]')).to.eql(null); // Host announces.
    act(() => count.focus());
    act(() => count.dispatchEvent(DomMock.Keyboard.keydownEvent('Enter', { bubbles: true })));
    act(() => count.dispatchEvent(DomMock.Keyboard.keyupEvent('Enter', { bubbles: true })));
    expect(label.getAttribute('aria-expanded')).to.eql('false');
    expect(rendered(container)).to.eql(['Complete']);
  });

  it('zero visible events → show the supplied count without a disclosure control', async () => {
    using res = await TestReact.render(<EventsView.UI items={[observed, finished]} tail={0} />);
    const view = within(res.container);
    expect(view.queryAllByRole('button')).to.eql([]);
    view.getByText(number.format(2));
    view.getByText(finished.kind);
  });

  it('open count follows same-length replacement and starts closed after an empty window', async () => {
    type Entry = { kind: string };
    let set!: (items: readonly Entry[]) => void;
    function Host() {
      const [items, update] = useState<readonly Entry[]>([observed]);
      set = update;
      return <EventsView.Value items={items} />;
    }
    using res = await TestReact.render(<Host />);
    const { container } = res;
    act(() => container.querySelector<HTMLElement>(button)!.click());
    expect(container.textContent).to.include(observed.kind);
    act(() => set([finished]));
    expect(container.textContent).to.include(finished.kind);
    expect(container.textContent).not.to.include(observed.kind);
    act(() => set([]));
    expect(container.textContent).to.eql('—');
    expect(container.querySelector(button)).to.eql(null);
    act(() => set([finished]));
    expect(container.textContent).to.eql(number.format(1));
  });

  it('list mode renders only the requested tail inside the host frame, without a toggle', async () => {
    const items = [observed, finished] as const;
    const cases = [
      { items: [], expected: [] },
      { items, tail: -1, expected: [] },
      { items, tail: 1.9, expected: [finished.kind] },
      { items, tail: Infinity, expected: [finished.kind, observed.kind] },
    ] as const;
    for (const { expected, ...props } of cases) {
      const value = (
        <EventsView.Value {...props} mode='list' renderItem={(e) => <em>{e.kind}</em>} />
      );
      using res = await TestReact.render(<KeyValue.UI items={[{ k: 'History', v: value }]} />);
      expect(rendered(res.container)).to.eql(expected);
      expect(res.container.querySelector(button)).to.eql(null);
      expect(res.container.querySelectorAll('[data-component$=":KeyValue"]').length).to.eql(1);
    }
  });

  it('keeps the event bus and DevHarness out of the public runtime leaf', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.fromFileUrl(import.meta.resolve('@sys/ui-components/react/event')),
      forbiddenImports: ['@sys/event', '@sys/ui-dev', '@sys/ui-components/react/dev'],
      forbiddenPathIncludes: ['/-spec/', '/-test/', '/-test.ui.ts', '/src/ui.react/dev/'],
    });
  });

  it('requires kind on public inputs even with a custom renderer', () => {
    // @ts-expect-error A renderer does not make an untagged event valid.
    void <EventsView.Value items={[{ type: 'untagged' }]} renderItem={() => 'custom'} />;
  });
});
