import React from 'react';

import {
  act,
  afterEach,
  beforeEach,
  Color,
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

const currentSelector = '[data-keyvalue-cursor-current="true"]';
const boundarySelector = '[data-keyvalue-item-boundary]';
const arrivalSelector = '[data-keyvalue-cursor-arrival-cue="true"]';

describe('KeyValue.UI: cursor affordance', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders a theme-derived zero-layout-shift current boundary fill', async () => {
    for (const name of ['Light', 'Dark'] as const) {
      const theme = Color.theme(name);
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

      expect(style.backgroundColor).to.eql(Color.alpha(theme.fg, 0.06));
      expect(style.borderTopWidth === '' || style.borderTopWidth === '0px').to.eql(true);

      const cue = current.querySelector(arrivalSelector) as HTMLElement;
      const cueStyle = window.getComputedStyle(cue);
      expect(cueStyle.position).to.eql('absolute');
      expect(cueStyle.pointerEvents).to.eql('none');
      expect(cueStyle.backgroundColor).to.eql(Color.alpha(theme.fg, 0.14));
      expect(current.querySelector('style')?.textContent?.includes('keyvalue-cursor-arrival-cue'))
        .to.eql(true);
      expect(cue.getAttribute('data-keyvalue-cursor-arrival-key')).to.eql('/alpha:atom');

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

  it('renders the arrival cue only for first cursor adoption', async () => {
    const Probe: React.FC = () => {
      const [model, setModel] = React.useState<t.KeyValue.Cursor.Model>({});
      const [, setTick] = React.useState(0);
      return (
        <>
          <KeyValue.UI
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
    expect(arrivalKeys(res.container)).to.eql(['/alpha:atom']);

    act(() => DomMock.Mouse.click(rerender));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/alpha']);
    expect(arrivalKeys(res.container)).to.eql([]);

    keydown(root, 'ArrowDown');
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/bravo']);
    expect(arrivalKeys(res.container)).to.eql([]);

    keydown(root, 'Escape');
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql([]);

    act(() => DomMock.Mouse.click(first, { altKey: true }));
    await Schedule.micro();
    expect(currentPaths(res.container)).to.eql(['/alpha']);
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

function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}

function currentPaths(container: HTMLElement) {
  return Array.from(container.querySelectorAll(currentSelector)).map((el) =>
    el.getAttribute('data-keyvalue-cursor-path')
  );
}

function arrivalKeys(container: HTMLElement) {
  return Array.from(container.querySelectorAll(arrivalSelector)).map((el) =>
    el.getAttribute('data-keyvalue-cursor-arrival-key')
  );
}
