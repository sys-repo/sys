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
import { Switch } from '../mod.ts';

describe('Buttons.Switch: toggle event', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders native switch button semantics', async () => {
    const res = await TestReact.render(<Switch value tooltip="Toggle value" />, { strict: false });

    const root = res.container.firstElementChild as HTMLButtonElement;
    expect(root.tagName).to.eql('BUTTON');
    expect(root.type).to.eql('button');
    expect(root.getAttribute('role')).to.eql('switch');
    expect(root.getAttribute('aria-checked')).to.eql('true');
    expect(root.disabled).to.eql(false);
    expect(root.getAttribute('title')).to.eql('Toggle value');

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('emits the current and next values on primary activation', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switch
        value={false}
        onToggle={(e) => events.push(`toggle:${e.current}:${e.next}:${e.synthetic.type}`)}
      />,
      { strict: false },
    );

    const root = res.container.firstElementChild as HTMLButtonElement;
    act(() => DomMock.Mouse.click(root));

    expect(events).to.eql(['toggle:false:true:click']);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('preserves onClick compatibility', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switch
        value={true}
        onClick={() => events.push('click')}
        onToggle={(e) => events.push(`toggle:${e.current}:${e.next}:${e.synthetic.type}`)}
      />,
      { strict: false },
    );

    const root = res.container.firstElementChild as HTMLButtonElement;
    act(() => DomMock.Mouse.click(root));

    expect(events).to.eql(['click', 'toggle:true:false:click']);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not emit onToggle when disabled', async () => {
    const events: boolean[] = [];
    const res = await TestReact.render(
      <Switch value enabled={false} onToggle={(e) => events.push(e.next)} />,
      { strict: false },
    );

    const root = res.container.firstElementChild as HTMLButtonElement;
    expect(root.disabled).to.eql(true);

    act(() => DomMock.Mouse.click(root));

    expect(events).to.eql([]);

    act(() => res.dispose());
    await Promise.resolve();
  });
});

