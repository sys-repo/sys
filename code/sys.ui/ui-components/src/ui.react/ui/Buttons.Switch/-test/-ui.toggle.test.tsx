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
import { button } from './u.fixture.ts';

describe('Buttons.Switch: toggle event', () => {
  DomMock.init({ beforeEach, afterEach });

  it('renders native switch button semantics', async () => {
    const res = await TestReact.render(
      <Switch id='sample-switch' value tooltip='Toggle value' aria-labelledby='sample-label' />,
      { strict: false },
    );

    const root = res.container.firstElementChild as HTMLButtonElement;
    expect(root.tagName).to.eql('BUTTON');
    expect(root.id).to.eql('sample-switch');
    expect(root.type).to.eql('button');
    expect(root.getAttribute('role')).to.eql('switch');
    expect(root.getAttribute('aria-checked')).to.eql('true');
    expect(root.disabled).to.eql(false);
    expect(root.getAttribute('title')).to.eql('Toggle value');
    expect(root.getAttribute('aria-labelledby')).to.eql('sample-label');

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
        value
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

  it('accepts zero-detail primary clicks without synthetic keyboard-to-mouse forwarding', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switch
        value={false}
        onClick={() => events.push('click')}
        onToggle={(e) => events.push(`toggle:${e.current}:${e.next}`)}
      />,
    );
    try {
      const root = button(res.container);
      const event = DomMock.Mouse.event('click', { button: 0, detail: 0 });
      act(() => root.dispatchEvent(event));
      expect(events).to.eql(['click', 'toggle:false:true']);
      // Click routing only: the DOM mock does not prove native Enter/Space synthesis.
    } finally {
      act(() => res.dispose());
    }
  });

  it('ignores non-primary clicks before either activation callback', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switch onClick={() => events.push('click')} onToggle={() => events.push('toggle')} />,
    );
    try {
      const root = button(res.container);
      for (const value of [1, 2]) {
        const event = DomMock.Mouse.event('click', { button: value });
        act(() => root.dispatchEvent(event));
      }
      expect(events).to.eql([]);
    } finally {
      act(() => res.dispose());
    }
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
