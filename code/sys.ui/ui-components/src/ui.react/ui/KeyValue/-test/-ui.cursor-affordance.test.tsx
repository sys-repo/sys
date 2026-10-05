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

const currentSelector = '[data-keyvalue-cursor-current="true"]';
const currentCellSelector = '[data-keyvalue-cursor-cell-current="true"]';
const boundarySelector = '[data-keyvalue-item-boundary]';
const arrivalSelector = '[data-keyvalue-cursor-arrival-cue="true"]';

describe('KeyValue.UI: cursor affordance', () => {
  DomMock.init({ beforeEach, afterEach });

  it('distinguishes focused and blurred current boundary affordance', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        cursor={{
          model: { current: KeyValue.Cursor.target(['alpha']) },
          onChange: () => undefined,
        }}
      />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    const current = res.container.querySelector(currentSelector) as HTMLElement;

    const blurredAlpha = backgroundAlpha(current);
    expect(blurredAlpha > 0).to.eql(true);

    act(() => root.focus());
    await Schedule.micro();
    const focusedAlpha = backgroundAlpha(current);
    expect(focusedAlpha > blurredAlpha).to.eql(true);

    act(() => root.blur());
    await Schedule.micro();
    const reblurredAlpha = backgroundAlpha(current);
    expect(reblurredAlpha > 0).to.eql(true);
    expect(reblurredAlpha < focusedAlpha).to.eql(true);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('does not treat focused interactive descendants as cursor-root focus', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={[{ id: 'alpha', k: 'alpha', v: <button type='button'>toggle</button> }]}
        cursor={{
          model: { current: KeyValue.Cursor.target(['alpha']) },
          onChange: () => undefined,
        }}
      />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    const button = res.container.querySelector('button') as HTMLButtonElement;
    const current = res.container.querySelector(currentSelector) as HTMLElement;

    const blurredAlpha = backgroundAlpha(current);
    expect(blurredAlpha > 0).to.eql(true);

    act(() => root.focus());
    await Schedule.micro();
    const focusedAlpha = backgroundAlpha(current);
    expect(focusedAlpha > blurredAlpha).to.eql(true);

    act(() => button.focus());
    await Schedule.micro();
    expect(document.activeElement).to.equal(button);
    expect(backgroundAlpha(current) < focusedAlpha).to.eql(true);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('tracks focused root by element identity, not shared generated class', async () => {
    let rerender: () => void = () => undefined;
    const Probe: React.FC = () => {
      const [, setTick] = React.useState(0);
      rerender = () => setTick((n) => n + 1);
      const cursor = {
        model: { current: KeyValue.Cursor.target(['alpha']) },
        onChange: () => undefined,
      };
      return (
        <>
          <KeyValue.UI items={[row('alpha')]} cursor={cursor} />
          <KeyValue.UI items={[row('alpha')]} cursor={cursor} />
        </>
      );
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const roots = keyValueRoots(res.container);
    const currents = currentBoundaries(res.container);
    const secondBlurredAlpha = backgroundAlpha(currents[1]);

    act(() => roots[0].focus());
    await Schedule.micro();
    expect(backgroundAlpha(currents[0]) > secondBlurredAlpha).to.eql(true);

    act(() => rerender());
    await Schedule.micro();
    const afterRerender = currentBoundaries(res.container);
    expect(backgroundAlpha(afterRerender[0]) > secondBlurredAlpha).to.eql(true);
    expect(backgroundAlpha(afterRerender[1]) < backgroundAlpha(afterRerender[0])).to.eql(true);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('distinguishes focused and blurred key/value lane affordance', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        cursor={{
          model: { current: KeyValue.Cursor.target(['alpha'], 'value') },
          onChange: () => undefined,
        }}
      />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    const currentCell = res.container.querySelector(currentCellSelector) as HTMLElement;

    const blurredAlpha = backgroundAlpha(currentCell);
    expect(blurredAlpha > 0).to.eql(true);

    act(() => root.focus());
    await Schedule.micro();
    const focusedAlpha = backgroundAlpha(currentCell);
    expect(focusedAlpha > blurredAlpha).to.eql(true);

    act(() => root.blur());
    await Schedule.micro();
    expect(backgroundAlpha(currentCell) < focusedAlpha).to.eql(true);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('distinguishes focused and blurred current affordance in the reorder shell path', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha'), row('bravo')]}
        reorder={{ onChange: () => undefined }}
        cursor={{
          model: { current: KeyValue.Cursor.target(['bravo']) },
          onChange: () => undefined,
        }}
      />,
      { strict: false },
    );
    const root = res.container.firstElementChild as HTMLElement;
    const current = res.container.querySelector(currentSelector) as HTMLElement;

    const blurredAlpha = backgroundAlpha(current);
    expect(blurredAlpha > 0).to.eql(true);

    act(() => root.focus());
    await Schedule.micro();
    const focusedAlpha = backgroundAlpha(current);
    expect(focusedAlpha > blurredAlpha).to.eql(true);

    act(() => root.blur());
    await Schedule.micro();
    expect(backgroundAlpha(current) < focusedAlpha).to.eql(true);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('renders zero-layout-shift current and arrival cue boundaries', async () => {
    for (const name of ['Light', 'Dark'] as const) {
      const res = await TestReact.render(
        <KeyValue.UI
          theme={name}
          items={[row('alpha')]}
          cursor={{
            model: { current: KeyValue.Cursor.target(['alpha']) },
            onChange: () => undefined,
          }}
        />,
        { strict: false },
      );
      const current = res.container.querySelector(currentSelector) as HTMLElement;
      const style = window.getComputedStyle(current);
      const currentAlpha = backgroundAlpha(current);

      expect(currentAlpha > 0).to.eql(true);
      expect(style.borderTopWidth === '' || style.borderTopWidth === '0px').to.eql(true);

      const cue = current.querySelector(arrivalSelector) as HTMLElement;
      const cueStyle = window.getComputedStyle(cue);
      expect(cueStyle.position).to.eql('absolute');
      expect(cueStyle.pointerEvents).to.eql('none');
      expect(backgroundAlpha(cue) > currentAlpha).to.eql(true);
      expect(current.querySelector('style')?.textContent?.includes('keyvalue-cursor-arrival-cue'))
        .to.eql(true);
      expect(cue.getAttribute('data-keyvalue-cursor-arrival-key')).to.eql('/alpha:atom');
      expect(cue.getAttribute('data-keyvalue-cursor-arrival-kind')).to.eql('first-adoption');

      act(() => res.dispose());
      await Schedule.micro();
    }
  });

  it('does not spend first adoption on an unresolved controlled current target', async () => {
    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({
        current: KeyValue.Cursor.target(['missing']),
      });
      return (
        <>
          <KeyValue.UI
            items={[row('alpha')]}
            cursor={{ model, onChange: (e) => setModel(e.next) }}
          />
          <button
            type='button'
            onClick={() => setModel({ current: KeyValue.Cursor.target(['alpha']) })}
          >
            resolve
          </button>
        </>
      );
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const resolve = res.container.querySelector('button') as HTMLButtonElement;

    expect(currentPaths(res.container)).to.eql([]);
    expect(arrivalKeys(res.container)).to.eql([]);

    act(() => DomMock.Mouse.click(resolve));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/alpha']);
    expect(arrivalKeys(res.container)).to.eql(['/alpha:atom']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('flashes first adoption strongly and target changes subtly', async () => {
    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
      const [, setTick] = React.useState(0);
      return (
        <>
          <KeyValue.UI
            theme='Dark'
            items={[row('alpha'), row('bravo')]}
            cursor={{ model, onChange: (e) => setModel(e.next) }}
          />
          <button type='button' onClick={() => setTick((n) => n + 1)}>rerender</button>
        </>
      );
    };

    const res = await TestReact.render(<Probe />, { strict: false });
    const root = res.container.firstElementChild as HTMLElement;
    const first = res.container.querySelector(boundarySelector) as HTMLElement;
    const rerender = res.container.querySelector('button') as HTMLButtonElement;

    expect(res.container.querySelector(arrivalSelector)).to.eql(null);

    act(() => DomMock.Mouse.click(first, { altKey: true }));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/alpha']);
    const firstCue = expectArrivalCue(res.container, '/alpha:atom', 'first-adoption');
    const firstAlpha = backgroundAlpha(firstCue);
    expect(firstAlpha > 0).to.eql(true);

    act(() => DomMock.Mouse.click(rerender));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/alpha']);
    expect(arrivalKeys(res.container)).to.eql([]);

    keydown(root, 'ArrowDown');
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/bravo']);
    const targetCue = expectArrivalCue(res.container, '/bravo:atom', 'target-change');
    const targetAlpha = backgroundAlpha(targetCue);
    expect(targetAlpha > 0).to.eql(true);
    expect(targetAlpha < firstAlpha).to.eql(true);

    keydown(root, 'Escape');
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql([]);

    act(() => DomMock.Mouse.click(first, { altKey: true }));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/alpha']);
    const readoptCue = expectArrivalCue(res.container, '/alpha:atom', 'target-change');
    expect(backgroundAlpha(readoptCue) > 0).to.eql(true);
    expect(backgroundAlpha(readoptCue) < firstAlpha).to.eql(true);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('can disable the arrival cue', async () => {
    const res = await TestReact.render(<CueModeProbe arrival={false} />, { strict: false });
    const [, bravo] = buttons(res.container);

    expect(currentPaths(res.container)).to.eql(['/alpha']);
    expect(arrivalKeys(res.container)).to.eql([]);

    act(() => DomMock.Mouse.click(bravo));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/bravo']);
    expect(arrivalKeys(res.container)).to.eql([]);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('renders the first adoption cue in the direct reorder shell path', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha'), row('bravo')]}
        reorder={{ onChange: () => undefined }}
        cursor={{
          model: { current: KeyValue.Cursor.target(['bravo']) },
          onChange: () => undefined,
        }}
      />,
      { strict: false },
    );

    expect(currentPaths(res.container)).to.eql(['/bravo']);
    expect(arrivalKeys(res.container)).to.eql(['/bravo:atom']);

    act(() => res.dispose());
    await Schedule.micro();
  });

  it('keys the arrival cue by cursor lane without changing target identity', async () => {
    const res = await TestReact.render(
      <KeyValue.UI
        items={[row('alpha')]}
        cursor={{
          model: { current: KeyValue.Cursor.target(['alpha'], 'value') },
          onChange: () => undefined,
        }}
      />,
      { strict: false },
    );
    const current = res.container.querySelector(currentSelector) as HTMLElement;
    const cue = current.querySelector(arrivalSelector) as HTMLElement;

    expect(current.getAttribute('data-keyvalue-cursor-path')).to.eql('/alpha');
    expect(current.getAttribute('data-keyvalue-cursor-current-part')).to.eql('value');
    expect(cue.getAttribute('data-keyvalue-cursor-arrival-key')).to.eql('/alpha:value');

    act(() => res.dispose());
    await Schedule.micro();
  });
});

const CueModeProbe: React.FC<{ arrival?: t.KeyValue.Cursor.Arrival }> = (props) => {
  const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({
    current: KeyValue.Cursor.target(['alpha']),
  });
  const [, setTick] = React.useState(0);

  return (
    <>
      <KeyValue.UI
        theme='Dark'
        items={[row('alpha'), row('bravo')]}
        cursor={{
          arrival: props.arrival,
          model,
          onChange: (e) => setModel(e.next),
        }}
      />
      <button
        type='button'
        onClick={() => setModel({ current: KeyValue.Cursor.target(['alpha']) })}
      >
        alpha
      </button>
      <button
        type='button'
        onClick={() => setModel({ current: KeyValue.Cursor.target(['bravo']) })}
      >
        bravo
      </button>
      <button type='button' onClick={() => setTick((n) => n + 1)}>rerender</button>
    </>
  );
};

function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}

function currentPaths(container: HTMLElement) {
  return currentBoundaries(container).map((el) => el.getAttribute('data-keyvalue-cursor-path'));
}

function currentBoundaries(container: HTMLElement) {
  return Array.from(container.querySelectorAll(currentSelector)) as HTMLElement[];
}

function keyValueRoots(container: HTMLElement) {
  return Array.from(container.children) as HTMLElement[];
}

function arrivalKeys(container: HTMLElement) {
  return Array.from(container.querySelectorAll(arrivalSelector)).map((el) =>
    el.getAttribute('data-keyvalue-cursor-arrival-key')
  );
}

function arrivalCue(container: HTMLElement) {
  return container.querySelector(arrivalSelector) as HTMLElement | null;
}

function expectArrivalCue(
  container: HTMLElement,
  key: string,
  kind: 'first-adoption' | 'target-change',
) {
  const cue = arrivalCue(container) as HTMLElement;
  expect(cue?.getAttribute('data-keyvalue-cursor-arrival-key')).to.eql(key);
  expect(cue?.getAttribute('data-keyvalue-cursor-arrival-kind')).to.eql(kind);
  return cue;
}

function backgroundAlpha(el: HTMLElement) {
  const value = window.getComputedStyle(el).backgroundColor;
  if (!value || value === 'transparent') return 0;
  if (!value.startsWith('rgba(')) return 1;

  const alpha = Number(value.slice(5, -1).split(',')[3]?.trim());
  return Number.isFinite(alpha) ? alpha : 0;
}

function buttons(container: HTMLElement) {
  return Array.from(container.querySelectorAll('button')) as HTMLButtonElement[];
}
