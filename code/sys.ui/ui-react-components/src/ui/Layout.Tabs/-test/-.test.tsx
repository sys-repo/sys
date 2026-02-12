import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Tabs } from '../mod.ts';

describe('Layout.Tabs', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.Tabs).to.equal(Tabs);
  });

  describe('pointer interaction semantics', () => {
    DomMock.init({ beforeAll, afterAll });

    const items = [
      { id: 'a', label: 'A', render: () => <div>{'A body'}</div> },
      { id: 'b', label: 'B', render: () => <div>{'B body'}</div> },
    ] as const;

    const pointerPatch = (el: HTMLElement) => {
      (el as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture = () => {};
      (el as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture =
        () => {};
    };
    const pointer = (type: 'pointerdown' | 'pointerup' | 'pointercancel') =>
      new window.Event(type, { bubbles: true });

    it('selected tab is inert, uses non-pointer cursor, and ignores pointer-cancel', async () => {
      const events: string[] = [];
      const res = await TestReact.render(
        <Tabs.UI items={items} value={'a'} onChange={(e) => events.push(e.id)} />,
        { strict: false },
      );

      const root = res.container.firstElementChild as HTMLElement;
      const strip = root.firstElementChild as HTMLElement;
      const selected = strip.children.item(0) as HTMLElement;
      pointerPatch(selected);

      selected.dispatchEvent(pointer('pointerdown'));
      selected.dispatchEvent(pointer('pointerup'));

      expect(events).to.eql([]);
      expect(window.getComputedStyle(selected).cursor).to.equal('default');
      const tabB = strip.children.item(1) as HTMLElement;
      pointerPatch(tabB);

      tabB.dispatchEvent(pointer('pointerdown'));
      tabB.dispatchEvent(pointer('pointercancel'));
      expect(events).to.eql([]);

      tabB.dispatchEvent(pointer('pointerdown'));
      tabB.dispatchEvent(pointer('pointerup'));
      expect(events).to.eql(['b']);
      res.dispose();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
  });
});
