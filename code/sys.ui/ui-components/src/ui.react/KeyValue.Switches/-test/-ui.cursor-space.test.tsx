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
import type { t } from '../../../-test.ts';
import { keydown } from '../../KeyValue/-test/u.keyboard.ts';
import { KeyValue } from '../../KeyValue/mod.ts';
import { Switches } from '../mod.ts';

const rootSelector = '[data-keyvalue-cursor-root="true"]';

describe('KeyValue.Switches: cursor Space action', () => {
  DomMock.init({ beforeEach, afterEach });

  it('toggles the current row atom with Space from the cursor root', async () => {
    const toggles: t.KeyValueSwitches.Item.Toggle.Args[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{ model: { current: { path: ['alpha'] } }, onChange: () => undefined }}
        items={[{ id: 'alpha', value: false, onToggle: (e) => toggles.push(e) }]}
      />,
      { strict: false },
    );

    const root = res.container.querySelector(rootSelector) as HTMLElement;
    keydown(root, ' ');

    expect(toggles.length).to.eql(1);
    expect(toggles[0].item.id).to.eql('alpha');
    expect(toggles[0].current).to.eql(false);
    expect(toggles[0].next).to.eql(true);
    expect(toggles[0].command.name).to.eql('keyvalue-switches:toggle');
    expect(toggles[0].command.payload.target).to.eql({ path: ['alpha'] });
    expect(toggles[0].source.kind).to.eql('cursor-keyboard');
    expect(toggles[0].synthetic).to.eql(undefined);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('toggles the current value lane and preserves command target truth', async () => {
    const toggles: t.KeyValueSwitches.Item.Toggle.Args[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{
          model: { current: { path: ['alpha'], part: 'value' } },
          onChange: () => undefined,
        }}
        items={[{ id: 'alpha', value: true, onToggle: (e) => toggles.push(e) }]}
      />,
      { strict: false },
    );

    const root = res.container.querySelector(rootSelector) as HTMLElement;
    keydown(root, ' ');

    expect(toggles.length).to.eql(1);
    expect(toggles[0].next).to.eql(false);
    expect(toggles[0].command.payload.target).to.eql({ path: ['alpha'], part: 'value' });
    expect(toggles[0].source.kind).to.eql('cursor-keyboard');

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not toggle key-lane targets', async () => {
    const toggles: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{ model: { current: { path: ['alpha'], part: 'key' } }, onChange: () => undefined }}
        items={[{ id: 'alpha', value: false, onToggle: (e) => toggles.push(e.item.id) }]}
      />,
      { strict: false },
    );

    const root = res.container.querySelector(rootSelector) as HTMLElement;
    const event = keydown(root, ' ');

    expect(event.defaultPrevented).to.eql(true);
    expect(toggles).to.eql([]);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not toggle disabled rows or rows without handlers', async () => {
    const toggles: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{ model: { current: { path: ['alpha'] } }, onChange: () => undefined }}
        items={[
          {
            id: 'alpha',
            value: false,
            enabled: false,
            onToggle: (e) => toggles.push(e.item.id),
          },
          { id: 'bravo', value: false },
        ]}
      />,
      { strict: false },
    );

    const root = res.container.querySelector(rootSelector) as HTMLElement;
    const event = keydown(root, ' ');

    expect(event.defaultPrevented).to.eql(true);
    expect(toggles).to.eql([]);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('resolves nested group cursor paths to the correct switch row', async () => {
    const toggles: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{
          model: { current: { path: ['group', 'nested'], part: 'value' } },
          onChange: () => undefined,
        }}
        items={[
          { id: 'alpha', value: false, onToggle: (e) => toggles.push(e.item.id) },
          {
            id: 'group',
            kind: 'group',
            items: [
              { id: 'nested', value: false, onToggle: (e) => toggles.push(e.item.id) },
              { id: 'other', value: false, onToggle: (e) => toggles.push(e.item.id) },
            ],
          },
        ]}
      />,
      { strict: false },
    );

    const root = res.container.querySelector(rootSelector) as HTMLElement;
    keydown(root, ' ');

    expect(toggles).to.eql(['nested']);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not add generic activation behavior to KeyValue.UI', async () => {
    const activations: string[] = [];
    const res = await TestReact.render(
      <KeyValue.UI
        cursor={{
          model: { current: { path: ['alpha'], part: 'value' } },
          onChange: () => undefined,
        }}
        items={[
          {
            id: 'alpha',
            k: 'Alpha',
            v: <button onClick={() => activations.push('button')}>Action</button>,
          },
        ]}
      />,
      { strict: false },
    );

    const root = res.container.querySelector(rootSelector) as HTMLElement;
    keydown(root, ' ');

    expect(activations).to.eql([]);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('keeps pointer toggles command-shaped with pointer provenance', async () => {
    const toggles: t.KeyValueSwitches.Item.Toggle.Args[] = [];
    const res = await TestReact.render(
      <Switches.UI
        cursor={{ onChange: () => undefined }}
        items={[{ id: 'alpha', value: false, onToggle: (e) => toggles.push(e) }]}
      />,
      { strict: false },
    );

    const label = res.container.querySelector(
      '[data-component="KeyValue.Switches.Label"]',
    ) as HTMLElement;
    act(() => DomMock.Mouse.click(label));

    expect(toggles.length).to.eql(1);
    expect(toggles[0].command.name).to.eql('keyvalue-switches:toggle');
    expect(toggles[0].command.payload.target).to.eql({ path: ['alpha'] });
    expect(toggles[0].source.kind).to.eql('pointer');
    expect(toggles[0].synthetic).to.not.eql(undefined);

    act(() => res.dispose());
    await Promise.resolve();
  });
});
