import { act, beforeEach, describe, DomMock, expect, it, renderHook } from '../../-test.ts';
import { useWebFont } from './mod.ts';

describe(`useWebFont`, () => {
  DomMock.polyfill();

  it('API', async () => {
    const m = await import('@sys/ui-react/use');
    expect(m.useWebFont).to.equal(useWebFont);
  });

  describe('integration (delegates to @sys/ui-css/WebFont)', () => {
    beforeEach(() => resetHead());

    it('injects a single <style> on mount', () => {
      renderHook(() =>
        useWebFont('/fonts/inter', {
          family: 'Inter',
          variable: true,
          fileForVariable: ({ dir }) => `${dir}/Inter-Var.woff2`,
        }),
      );

      const styles = byFamily('Inter');
      expect(styles.length).to.eql(1);
      const css = styles[0].textContent ?? '';
      expect(css.includes('font-family: Inter')).to.eql(true);
      expect(css.includes('font-weight: 100 900;')).to.eql(true);
      expect(css.includes('url(/fonts/inter/Inter-Var.woff2)')).to.eql(true);
    });

    it('idempotent across multiple mounts with the same args', () => {
      renderHook(() =>
        useWebFont('/fonts/inter', {
          family: 'Inter',
          variable: true,
          fileForVariable: ({ dir }) => `${dir}/Inter-Var.woff2`,
        }),
      );
      renderHook(() =>
        useWebFont('/fonts/inter', {
          family: 'Inter',
          variable: true,
          fileForVariable: ({ dir }) => `${dir}/Inter-Var.woff2`,
        }),
      );

      expect(byFamily('Inter').length).to.eql(1);
    });

    it('different key (dir) yields a second <style> (delegated key semantics)', () => {
      renderHook(() =>
        useWebFont('/fonts/a', {
          family: 'Inter',
          variable: true,
          fileForVariable: ({ dir }) => `${dir}/Inter-Var.woff2`,
        }),
      );
      renderHook(() =>
        useWebFont('/fonts/b', {
          family: 'Inter',
          variable: true,
          fileForVariable: ({ dir }) => `${dir}/Inter-Var.woff2`,
        }),
      );

      expect(byFamily('Inter').length).to.eql(2);
    });

    it('no re-injection on rerender (effect has empty deps)', () => {
      const { rerender } = renderHook(
        ({ dir }) =>
          useWebFont(dir, {
            family: 'Inter',
            variable: true,
            fileForVariable: ({ dir }) => `${dir}/Inter-Var.woff2`,
          }),
        { initialProps: { dir: '/fonts/inter' } },
      );

      expect(byFamily('Inter').length).to.eql(1);

      // Rerender with same props: effect should not fire again:
      act(() => rerender({ dir: '/fonts/inter' }));
      expect(byFamily('Inter').length).to.eql(1);
    });
  });
});

/**
 * Helpers:
 */
const DATA_ATTR = 'data-sys-fonts';
function byFamily(name: string) {
  return Array.from(document.querySelectorAll<HTMLStyleElement>(`style[${DATA_ATTR}="${name}"]`));
}
function resetHead() {
  Array.from(document.querySelectorAll(`style[${DATA_ATTR}]`)).forEach((n) => n.remove());
}
