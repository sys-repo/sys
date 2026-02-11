import {
  act,
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
} from '../../-test.ts';
import { WebFont as Base } from './common.ts';
import { useWebFont, WebFont } from './mod.ts';

describe(`useWebFont`, () => {
  DomMock.init({ beforeAll, afterAll });

  it('API', async () => {
    const m = await import('@sys/ui-react/use');
    expect(m.useWebFont).to.equal(useWebFont);
    expect(m.WebFont).to.equal(WebFont);
    expect(m.WebFont.inject).to.equal(Base.inject);
    expect(m.WebFont.useWebFont).to.equal(useWebFont);
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

    it('re-runs for changed args and injects new family', () => {
      const { rerender } = renderHook(
        ({ dir, family }) =>
          useWebFont(dir, {
            family,
            variable: true,
            fileForVariable: ({ dir }) => `${dir}/source-sans-3-var.woff2`,
          }),
        { initialProps: { dir: '/fonts/source-sans-3', family: 'Source Sans 3' } },
      );

      expect(byFamily('Source Sans 3').length).to.eql(1);

      act(() => rerender({ dir: '/fonts/et-book', family: 'ET Book' }));
      expect(byFamily('Source Sans 3').length).to.eql(1);
      expect(byFamily('ET Book').length).to.eql(1);
    });

    it('does not re-run for equivalent semantic options with new object identity', () => {
      const originalInject = Base.inject;
      let calls = 0;
      (Base as { inject: typeof Base.inject }).inject = ((...args: Parameters<typeof Base.inject>) => {
        calls++;
        return originalInject(...args);
      }) as typeof Base.inject;

      try {
        const { rerender } = renderHook(
          ({ tick }) =>
            useWebFont('/fonts/source-sans-3', {
              family: 'Source Sans 3',
              variable: true,
              italic: true,
              local: ['Source Sans 3'],
              weights: [400, 700],
              fileForVariable: ({ dir, italic }) => {
                return italic ? `${dir}/source-sans-3-var-italic.woff2` : `${dir}/source-sans-3-var.woff2`;
              },
              // changes object identity on rerender, semantic deps are unchanged.
              display: tick > -1 ? 'swap' : 'swap',
            }),
          { initialProps: { tick: 0 } },
        );

        expect(calls).to.eql(1);
        act(() => rerender({ tick: 1 }));
        expect(calls).to.eql(1);
      } finally {
        (Base as { inject: typeof Base.inject }).inject = originalInject;
      }
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
