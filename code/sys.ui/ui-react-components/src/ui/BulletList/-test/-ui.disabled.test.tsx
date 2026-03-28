import { act, afterEach, beforeEach, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { BulletList } from '../mod.ts';

describe('BulletList.UI disabled interaction', () => {
  DomMock.init({ beforeEach, afterEach });

  it('does not emit onSelect for disabled items', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <BulletList.UI
        items={[
          { id: 'enabled' },
          { id: 'disabled', enabled: false },
        ]}
        onSelect={(e) => events.push(e.id)}
      />,
      { strict: false },
    );

    const root = res.container.firstElementChild as HTMLElement;
    const enabled = root.children.item(0) as HTMLElement;
    const disabled = root.children.item(1) as HTMLElement;
    act(() => {
      enabled.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
      disabled.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
    });

    expect(events).to.eql(['enabled']);

    act(() => res.dispose());
    await Promise.resolve();
  });
});
