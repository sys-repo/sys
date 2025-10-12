import { Is, describe, expect, it, renderHook } from '../../-test.ts';
import { useMonacoEditorModule } from './use.MonacoEditorModule.ts';

describe('MonacoEditor', () => {
  describe('hook: useMonacoEditorModule', () => {
    it('throws on non-browser environment', () => {
      const origWindow = (globalThis as any).window;
      const origDocument = (globalThis as any).document;

      // Simulate server/test env (no DOM):
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      expect(Is.browser()).to.eql(false); // Sanity check.

      try {
        const fn = () => renderHook(() => useMonacoEditorModule());
        expect(fn).to.throw();
      } finally {
        // Restore for other tests:
        (globalThis as any).window = origWindow;
        (globalThis as any).document = origDocument;
      }
    });
  });
});
