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

  it('emits the current and next values on primary activation', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <Switch
        value={false}
        onToggle={(e) => events.push(`toggle:${e.current}:${e.next}:${e.synthetic.type}`)}
      />,
      { strict: false },
    );

    const root = res.container.firstElementChild as HTMLElement;
    act(() => activate(root));

    expect(events).to.eql(['toggle:false:true:mouseup']);

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

    const root = res.container.firstElementChild as HTMLElement;
    act(() => activate(root));

    expect(events).to.eql(['click', 'toggle:true:false:mouseup']);

    act(() => res.dispose());
    await Promise.resolve();
  });

  it('does not emit onToggle when disabled', async () => {
    const events: boolean[] = [];
    const res = await TestReact.render(
      <Switch value enabled={false} onToggle={(e) => events.push(e.next)} />,
      { strict: false },
    );

    const root = res.container.firstElementChild as HTMLElement;
    act(() => activate(root));

    expect(events).to.eql([]);

    act(() => res.dispose());
    await Promise.resolve();
  });
});

/**
 * Helpers:
 */
function activate(el: HTMLElement) {
  el.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, button: 0 }));
  el.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, button: 0 }));
}
