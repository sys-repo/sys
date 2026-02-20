import { Is, describe, expect, it, renderHook, DomMock, MonacoFake } from '../../-test.ts';
import { type t } from './common.ts';
import { useMonacoEditorModule } from './use.MonacoEditorModule.ts';
import { toKeyDownEvent } from './u.keyboard.ts';

describe('MonacoEditor', () => {
  describe('hook: useMonacoEditorModule', () => {
    it('throws on non-browser environment', () => {
      DomMock.unpolyfill();

      const origWindow = (globalThis as any).window;
      const origDocument = (globalThis as any).document;

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
        // Restore for other tests:
        (globalThis as any).window = origWindow;
        (globalThis as any).document = origDocument;
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
