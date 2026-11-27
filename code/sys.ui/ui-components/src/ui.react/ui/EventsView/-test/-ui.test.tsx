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
    act(() => count.click());
    expect(label.getAttribute('aria-expanded')).to.eql('false');
    expect(rendered(container)).to.eql(['Complete']);
  });

  it('applies both local toggles when label and count activate in the same batch', async () => {
    using res = await TestReact.render(<EventsView.UI items={[observed, finished]} />);
    const view = within(res.container);
    const label = view.getByRole('button', { name: 'events' });
    const count = view.getByRole('button', { name: number.format(2) });
    act(() => {
      label.click();
      count.click();
    });
    expect(label.getAttribute('aria-expanded')).to.eql('false');
    expect(count.getAttribute('aria-expanded')).to.eql('false');
  });

  it('host owns the requested value even when a request is declined or history is hidden', async () => {
    const requests: boolean[] = [];
    const items = [observed, finished];
    type Knobs = { expanded: boolean; tail: number; mode?: 'count' | 'list'; empty?: boolean };
    let set!: (next: Knobs) => void;
    function Host() {
      const [knobs, update] = useState<Knobs>({ expanded: false, tail: 5 });
      set = update;
      return (
        <EventsView.UI
          items={knobs.empty ? [] : items}
          mode={knobs.mode}
          tail={knobs.tail}
          disclosure={{ expanded: knobs.expanded, onToggle: (next) => requests.push(next) }}
        />
      );
    }
    using res = await TestReact.render(<Host />);
    const view = within(res.container);
    const label = () => view.getByRole('button', { name: 'events' });
    const count = () => view.getByRole('button', { name: '2' });
    const id = label().getAttribute('aria-controls')!;
    act(() => label().click());
    expect(requests).to.eql([true]);
    expect(count().getAttribute('aria-controls')).to.eql(id);
    expect(count().getAttribute('aria-expanded')).to.eql('false');
    expect(document.getElementById(id)?.hidden).to.eql(true);
    act(() => set({ expanded: true, tail: 5 }));
    expect(label().getAttribute('aria-expanded')).to.eql('true');
    expect(document.getElementById(id)?.hidden).to.eql(false);
    act(() => set({ expanded: true, tail: 0 }));
    view.getByText('2');
    expect(view.queryAllByRole('button')).to.eql([]);
    expect(document.getElementById(id)).to.eql(null);
    act(() => set({ expanded: true, tail: 5 }));
    expect(count().getAttribute('aria-expanded')).to.eql('true');
    act(() => set({ expanded: true, tail: 5, mode: 'list' }));
    act(() => set({ expanded: true, tail: 5, empty: true }));
    act(() => set({ expanded: true, tail: 5 }));
    expect(document.getElementById(id)?.hidden).to.eql(false);
    expect(requests).to.eql([true]);
  });

  it('disclosure lifetime changes preserve the focused caller-owned label', async () => {
    const items = [observed];
    const binding = { expanded: false, onToggle: () => {} };
    type Phase = 'empty' | 'local' | 'list' | 'host';
    let change!: (phase: Phase) => void;
    function Host() {
      const [phase, setPhase] = useState<Phase>('empty');
      change = setPhase;
      return (
        <EventsView.UI
          labels={{ latest: <button>Inspect latest</button> }}
          items={phase === 'empty' ? [] : items}
          mode={phase === 'list' ? 'list' : 'count'}
          disclosure={phase === 'host' ? binding : undefined}
        />
      );
    }
    using res = await TestReact.render(<Host />);
    const label = within(res.container).getByRole('button', { name: 'Inspect latest' });
    act(() => label.focus());
    for (const phase of ['local', 'list', 'local', 'host', 'local', 'empty'] as const) {
      act(() => change(phase));
      expect(document.activeElement === label, `same focused node in ${phase}`).to.eql(true);
    }
  });

  it('count captions stay sans-serif when event values are mono', async () => {
    using res = await TestReact.render(
      <EventsView.UI items={[observed, finished]} tail={1} mono />,
    );
    const view = within(res.container);
    const font = (el: Element) => window.getComputedStyle(el).fontFamily;
    expect(font(view.getByText('2'))).to.eql('sans-serif');
    act(() => view.getByRole('button', { name: 'events' }).click());
    expect(font(view.getByText('1 of 2'))).to.eql('sans-serif');
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
    let list!: (on: boolean) => void;
    let limit!: (n: number) => void;
    function Host() {
      const [items, update] = useState<readonly Entry[]>([observed]);
      const [isList, setList] = useState(false);
      const [tail, setTail] = useState(5);
      set = update;
      list = setList;
      limit = setTail;
      return <EventsView.Value items={items} mode={isList ? 'list' : 'count'} tail={tail} />;
    }
    using res = await TestReact.render(<Host />);
    const { container } = res;
    act(() => container.querySelector<HTMLElement>(button)!.click());
    expect(container.textContent).to.include(observed.kind);
    act(() => set([finished]));
    expect(container.textContent).to.include(finished.kind);
    expect(container.textContent).not.to.include(observed.kind);
    act(() => limit(0));
    expect(container.querySelector(button)).to.eql(null);
    act(() => limit(5));
    expect(container.textContent).to.include(finished.kind);
    act(() => list(true));
    act(() => list(false));
    expect(container.textContent).to.eql(number.format(1));
    act(() => container.querySelector<HTMLElement>(button)!.click());
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

  it('embedded and standalone counts reference independent panels; custom labels stay plain', async () => {
    using res = await TestReact.render(
      <>
        <EventsView.UI items={[observed]} labels={{ events: 'History' }} />
        <EventsView.Value items={[finished]} disclosure={{ expanded: true, onToggle: () => {} }} />
      </>,
    );
    const view = within(res.container);
    expect(view.getByText('History').closest(button)).to.eql(null);
    const panels = view.getAllByRole('button').map((el) =>
      document.getElementById(el.getAttribute('aria-controls')!)!
    );
    expect(panels.map((el) => el.hidden)).to.eql([true, false]);
    expect(panels[1].textContent).to.include(finished.kind);
  });

  it('keeps the event bus and DevHarness out of the public runtime leaf', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: Path.fromFileUrl(import.meta.resolve('@sys/ui-components/react/event')),
      forbiddenImports: ['@sys/event', '@sys/ui-dev', '@sys/ui-components/react/dev'],
      forbiddenPathIncludes: ['/-spec/', '/-test/', '/-test.ui.ts', '/src/ui.react/dev/'],
    });
  });

  it('requires kind on events and both halves of a supplied disclosure binding', () => {
    // @ts-expect-error A renderer does not make an untagged event valid.
    void <EventsView.Value items={[{ type: 'untagged' }]} renderItem={() => 'custom'} />;
    // @ts-expect-error A host-owned snapshot needs a writer.
    void <EventsView.UI items={[]} disclosure={{ expanded: false }} />;
    // @ts-expect-error A writer alone cannot supply the current snapshot.
    void <EventsView.Value items={[]} disclosure={{ onToggle: () => {} }} />;
  });
});
