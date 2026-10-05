import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { Switches } from '../mod.ts';

describe('KeyValue.Switches: cursor-entry interaction', () => {
  DomMock.init({ beforeEach, afterEach });

  it('does not toggle labels on cursor-entry clicks', async () => {
    const toggles: string[] = [];
    const cursor: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{ onChange: (e) => cursor.push(e.next.current?.path.join('/') ?? '') }}
        items={[{ id: 'alpha', value: false, onToggle: (e) => toggles.push(e.item.id) }]}
      />,
      { strict: false },
    );

    const label = res.container.querySelector('[data-component="KeyValue.Switches.Label"]') as HTMLElement;
    act(() => DomMock.Mouse.click(label, { altKey: true }));

    expect(toggles).to.eql([]);
    expect(cursor).to.eql(['alpha']);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not toggle value-side switches on cursor-entry clicks', async () => {
    const toggles: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{ onChange: () => undefined }}
        items={[{ id: 'alpha', value: false, onToggle: (e) => toggles.push(e.item.id) }]}
      />,
      { strict: false },
    );

    const button = res.container.querySelector('button[role="switch"]') as HTMLButtonElement;
    act(() => DomMock.Mouse.click(button, { altKey: true }));

    expect(toggles).to.eql([]);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not treat unrelated modified clicks as cursor-entry suppression', async () => {
    const toggles: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{ onChange: () => undefined }}
        items={[{ id: 'alpha', value: false, onToggle: (e) => toggles.push(e.item.id) }]}
      />,
      { strict: false },
    );

    const label = res.container.querySelector('[data-component="KeyValue.Switches.Label"]') as HTMLElement;
    act(() => DomMock.Mouse.click(label, { ctrlKey: true }));

    expect(toggles).to.eql(['alpha']);

    act(() => res.dispose());
    await Promise.resolve();
  });
});
