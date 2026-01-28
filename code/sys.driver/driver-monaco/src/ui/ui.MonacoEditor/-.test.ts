import { Is, describe, expect, it, renderHook, DomMock } from '../../-test.ts';
import { useMonacoEditorModule } from './use.MonacoEditorModule.ts';

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
});
