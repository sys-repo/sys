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

describe('KeyValue.Switches: focus-entry interaction', () => {
  DomMock.init({ beforeEach, afterEach });

  it('does not toggle labels on focus-entry clicks', async () => {
    const toggles: string[] = [];
    const focus: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        focus={{ onChange: (e) => focus.push(e.next.active?.path.join('/') ?? '') }}
        items={[{ id: 'alpha', value: false, onToggle: (e) => toggles.push(e.item.id) }]}
      />,
      { strict: false },
    );

    const label = res.container.querySelector('[data-component="KeyValue.Switches.Label"]') as HTMLElement;
    act(() => DomMock.Mouse.click(label, { altKey: true }));

    expect(toggles).to.eql([]);
    expect(focus).to.eql(['alpha']);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not toggle value-side switches on focus-entry clicks', async () => {
    const toggles: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        focus={{ onChange: () => undefined }}
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

  it('does not treat unrelated modified clicks as focus-entry suppression', async () => {
    const toggles: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        focus={{ onChange: () => undefined }}
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
