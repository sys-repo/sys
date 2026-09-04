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

describe('KeyValue.Switches: label interaction', () => {
  DomMock.init({ beforeEach, afterEach });

  it('toggles a row from its label', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        items={[
          {
            id: 'alpha',
            label: 'Alpha label',
            value: false,
            onToggle: (e) => {
              const type = e.source.kind === 'pointer' ? e.source.event.type : '';
              events.push(`${e.item.id}:${e.index}:${e.current}:${e.next}:${type}`);
            },
          },
        ]}
      />,
      { strict: false },
    );

    const label = res.container.querySelector(
      '[data-component="KeyValue.Switches.Label"]',
    ) as HTMLElement;
    const button = res.container.querySelector('button[role="switch"]') as HTMLButtonElement;
    expect(label.id.includes('KeyValue.Switches.Label:0:alpha')).to.eql(true);
    expect(label.textContent).to.eql('Alpha label');
    expect(label.getAttribute('aria-disabled')).to.eql(null);
    expect(button.getAttribute('aria-label')).to.eql(null);
    expect(button.getAttribute('aria-labelledby')).to.eql(label.id);

    act(() => DomMock.Mouse.click(label));

    expect(events).to.eql(['alpha:0:false:true:click']);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('scopes label ids to rendered switch rows', async () => {
    const res = await TestReact.render(
      <>
        <Switches.UI
          items={[
            { id: 'same', value: false, onToggle: () => undefined },
            {
              id: 'group',
              kind: 'group',
              items: [{ id: 'same', value: true, onToggle: () => undefined }],
            },
          ]}
        />
        <Switches.UI items={[{ id: 'same', value: false, onToggle: () => undefined }]} />
      </>,
      { strict: false },
    );

    const labels = [
      ...res.container.querySelectorAll('[data-component="KeyValue.Switches.Label"]'),
    ] as HTMLElement[];
    const buttons = [
      ...res.container.querySelectorAll('button[role="switch"]'),
    ] as HTMLButtonElement[];
    const ids = labels.map((label) => label.id);

    expect(ids.length).to.eql(3);
    expect(new Set(ids).size).to.eql(ids.length);
    buttons.forEach((button, index) =>
      expect(button.getAttribute('aria-labelledby')).to.eql(ids[index])
    );

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('names public conversion switches without unsafe DOM ids', async () => {
    const stringLabel = Switches.toItem({
      id: 'fallback-id',
      label: 'Fallback label',
      onToggle: () => undefined,
    });
    const nodeLabel = Switches.toItem({
      id: 'node-label-id',
      label: <span>Node label</span>,
      onToggle: () => undefined,
    });

    const res = await TestReact.render(
      <>
        {stringLabel.v}
        {nodeLabel.v}
      </>,
      { strict: false },
    );

    const buttons = [
      ...res.container.querySelectorAll('button[role="switch"]'),
    ] as HTMLButtonElement[];
    expect(buttons.length).to.eql(2);
    expect(buttons[0].getAttribute('aria-labelledby')).to.eql(null);
    expect(buttons[0].getAttribute('aria-label')).to.eql('Fallback label');
    expect(buttons[1].getAttribute('aria-labelledby')).to.eql(null);
    expect(buttons[1].getAttribute('aria-label')).to.eql('node-label-id');

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not toggle disabled labels or rows without handlers', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        items={[
          {
            id: 'disabled',
            value: false,
            enabled: false,
            onToggle: (e) => events.push(e.item.id),
          },
          { id: 'missing-handler', value: false },
        ]}
      />,
      { strict: false },
    );

    const labels = [
      ...res.container.querySelectorAll('[data-component="KeyValue.Switches.Label"]'),
    ] as HTMLElement[];
    expect(labels.length).to.eql(2);
    expect(labels[0].getAttribute('aria-disabled')).to.eql('true');
    expect(labels[1].getAttribute('aria-disabled')).to.eql('true');

    act(() => {
      DomMock.Mouse.click(labels[0]);
      DomMock.Mouse.click(labels[1]);
    });

    expect(events).to.eql([]);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('routes the value-side switch through the same row toggle action', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switches.UI
        items={[
          {
            id: 'bravo',
            value: true,
            onToggle: (e) => {
              const type = e.source.kind === 'pointer' ? e.source.event.type : '';
              events.push(`${e.item.id}:${e.index}:${e.current}:${e.next}:${type}`);
            },
          },
        ]}
      />,
      { strict: false },
    );

    const button = res.container.querySelector('button[role="switch"]') as HTMLButtonElement;
    act(() => DomMock.Mouse.click(button));

    expect(events).to.eql(['bravo:0:true:false:click']);

    act(() => res.dispose());
    await Promise.resolve();
  });
});
