import { Is, Schedule, describe, expect, it, renderHook, DomMock, MonacoFake } from '../../-test.ts';
import { type t } from './common.ts';
import { useMonacoEditorModule } from './use.MonacoEditorModule.ts';
import { toKeyDownEvent } from './u.keyboard.ts';

const local = {
  snapshotGlobals() {
    const state = {
      window: (globalThis as any).window,
      document: (globalThis as any).document,
      MediaStream: (globalThis as any).MediaStream,
      MediaStreamTrack: (globalThis as any).MediaStreamTrack,
      HTMLElement: (globalThis as any).HTMLElement,
      self: (globalThis as any).self,
      __SYS_BROWSER_MOCK__: (globalThis as any).__SYS_BROWSER_MOCK__,
    } as const;

    return () => {
      for (const [key, value] of Object.entries(state)) {
        if (value === undefined) delete (globalThis as any)[key];
        else (globalThis as any)[key] = value;
      }
    };
  },

  async drainDomTails() {
    await Schedule.micro();
    await Schedule.macro();
    await Schedule.raf();
    await Schedule.macro();
  },
} as const;

describe('MonacoEditor', () => {
  describe('hook: useMonacoEditorModule', () => {
    it('throws on non-browser environment', async () => {
      const restoreGlobals = local.snapshotGlobals();
      DomMock.unpolyfill();
      await local.drainDomTails();

      // Simulate server/test env (no DOM):
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      expect(Is.browser()).to.eql(false); // Sanity check.

      let unmount: (() => void) | undefined;
      try {
        const fn = () => {
          const h = renderHook(() => useMonacoEditorModule());
          unmount = h.unmount;
        };
        expect(fn).to.throw();
        if (unmount) unmount();
      } finally {
        restoreGlobals();
      }
    });
  });

  describe('keyboard', () => {
    it('maps Monaco keydown event to normalized payload', () => {
      const monaco = MonacoFake.monaco({ cast: true });
      const editor = MonacoFake.editor('');

      let event: Parameters<t.Monaco.Editor['onKeyDown']>[0] extends (e: infer E) => unknown ? E : never;
      editor.onKeyDown((e) => {
        event = e;
      });
      editor._fireKeyDown({ key: 'Escape', code: 'Escape', ctrlKey: true, shiftKey: true });

      const res = toKeyDownEvent(editor, monaco, event!);

      expect(res.key).to.eql('Escape');
      expect(res.modifiers).to.eql({
        shift: true,
        alt: false,
        ctrl: true,
        meta: false,
      });
    });
  });
});
