import { act, afterEach, beforeEach, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Tabs } from '../mod.ts';

describe('Layout.Tabs', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/layout/tabs');
    expect(m.Tabs).to.equal(Tabs);
  });

  describe('pointer interaction semantics', () => {
    DomMock.init({ beforeEach, afterEach });

    const items = [
      { id: 'a', label: 'A', render: () => <div>{'A body'}</div> },
      { id: 'b', label: 'B', render: () => <div>{'B body'}</div> },
    ] as const;

    const pointerPatch = (el: HTMLElement) => {
      let captured = false;
      const target = el as HTMLElement & {
        setPointerCapture: (id: number) => void;
        hasPointerCapture: (id: number) => boolean;
        releasePointerCapture: (id: number) => void;
      };

      target.setPointerCapture = () => {
        captured = true;
      };
      target.hasPointerCapture = () => captured;
      target.releasePointerCapture = () => {
        captured = false;
      };
    };
    const pointer = (type: 'pointerdown' | 'pointerup' | 'pointercancel') =>
      new window.Event(type, { bubbles: true });

    it('selected tab is inert, uses non-pointer cursor, and ignores pointer-cancel', async () => {
      const events: string[] = [];
      const res = await TestReact.render(
        <Tabs.UI items={items} value={'a'} onChange={(e) => events.push(e.id)} />,
        { strict: false },
      );
      await Promise.resolve();

      const root = res.container.firstElementChild as HTMLElement;
      if (!root) throw new Error('expected Tabs root element');
      const strip = root.firstElementChild as HTMLElement;
      const selected = strip.children.item(0) as HTMLElement;
      pointerPatch(selected);

      act(() => {
        selected.dispatchEvent(pointer('pointerdown'));
        selected.dispatchEvent(pointer('pointerup'));
      });

      expect(events).to.eql([]);
      expect(window.getComputedStyle(selected).cursor).to.equal('default');
      const tabB = strip.children.item(1) as HTMLElement;
      pointerPatch(tabB);

      act(() => {
        tabB.dispatchEvent(pointer('pointerdown'));
        tabB.dispatchEvent(pointer('pointercancel'));
      });
      expect(events).to.eql([]);

      act(() => {
        tabB.dispatchEvent(pointer('pointerdown'));
        tabB.dispatchEvent(pointer('pointerup'));
      });
      expect(events).to.eql(['b']);

      for (let i = 0; i < 40; i++) {
        const next = i % 2 === 0 ? tabB : selected;
        act(() => {
          next.dispatchEvent(pointer('pointerdown'));
          next.dispatchEvent(pointer('pointerup'));
        });
      }
      const baseline = events.length;
      expect(baseline).to.equal(21);

      let seed = 12345;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
      };
      let expectedDeterministic = 0;
      for (let i = 0; i < 500; i++) {
        const target = rand() < 0.5 ? tabB : selected;
        const cancel = rand() < 0.2;
        act(() => {
          target.dispatchEvent(pointer('pointerdown'));
          target.dispatchEvent(pointer(cancel ? 'pointercancel' : 'pointerup'));
        });
        if (!cancel && target === tabB) expectedDeterministic += 1;
      }

      expect(events.length).to.equal(baseline + expectedDeterministic);
      expect(events.every((id) => id === 'b')).to.equal(true);
      act(() => res.dispose());
      await Promise.resolve();
    });
  });
});
