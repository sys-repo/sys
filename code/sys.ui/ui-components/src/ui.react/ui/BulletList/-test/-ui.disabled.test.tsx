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
import { BulletList } from '../mod.ts';
import { key, mouse, touch } from '../../Button/-test/u.fixture.ts';

describe('BulletList.UI disabled interaction', () => {
  DomMock.init({ beforeEach, afterEach });

  it('disabled selected row → retain state but reject every activation path', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <BulletList.UI
        selected='disabled'
        items={[{ id: 'enabled' }, { id: 'disabled', enabled: false }]}
        onActivate={(e) => events.push(e.id)}
      />,
    );
    try {
      const [enabled, disabled] = res.container.querySelectorAll<HTMLElement>('[role="button"]');
      expect(disabled.getAttribute('aria-pressed')).to.eql('true');
      expect(disabled.getAttribute('aria-disabled')).to.eql('true');
      expect(disabled.tabIndex).to.eql(-1);
      for (const target of [enabled, disabled]) {
        mouse(target, 'mousedown');
        mouse(target, 'mouseup');
      }
      act(() => disabled.focus());
      for (const value of ['Enter', ' ']) {
        key(disabled, 'keydown', value);
        key(disabled, 'keyup', value);
      }
      act(() => disabled.click());
      touch(disabled, 'touchstart');
      touch(disabled, 'touchend');
      expect(events).to.eql(['enabled']);
      expect(disabled.getAttribute('aria-pressed')).to.eql('true');
    } finally {
      act(() => res.dispose());
    }
  });
});
