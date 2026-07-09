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
            onToggle: (e) => events.push(`${e.item.id}:${e.index}:${e.current}:${e.next}:${e.synthetic.type}`),
          },
        ]}
      />,
      { strict: false },
    );

    const label = res.container.querySelector('[data-component="KeyValue.Switches.Label"]') as HTMLElement;
    expect(label.textContent).to.eql('Alpha label');
    expect(label.getAttribute('aria-disabled')).to.eql(null);

    act(() => DomMock.Mouse.click(label));

    expect(events).to.eql(['alpha:0:false:true:click']);

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

    const labels = [...res.container.querySelectorAll('[data-component="KeyValue.Switches.Label"]')] as HTMLElement[];
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
            onToggle: (e) => events.push(`${e.item.id}:${e.index}:${e.current}:${e.next}:${e.synthetic.type}`),
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
