import { afterEach, beforeEach, describe, DomMock, expect, it } from '../-test.ts';
import { type t, D } from './common.ts';
import { WebFont } from './mod.ts';

describe(`useWebFont`, () => {
  // NB: before/after-each intentional.
  DomMock.init({ beforeEach, afterEach });

  it('API', async () => {
    const m = await import('@sys/ui-css');
    expect(m.WebFont).to.equal(WebFont);
  });

  describe('WebFont.inject', () => {
    describe('environment', () => {
      it('SSR-safe: no DOM → injected:false', async () => {
        DomMock.unpolyfill();
        const doc = (globalThis as any).document;
        (globalThis as any).document = undefined;

        const res = WebFont.inject('/fonts/x', { family: 'X', variable: true });
        expect(res.injected).to.eql(false);

        (globalThis as any).document = doc; // restore
      });

      it('DOM available via DomMock', () => {
        DomMock.polyfill();
        expect(typeof document).to.eql('object');
        expect(document.head).to.not.eql(undefined);
        DomMock.unpolyfill();
      });
    });

    describe('idempotency', () => {
      beforeEach(() => resetHead());

      it('inserts a single <style> per key; second call is a no-op', () => {
        const a = WebFont.inject('/fonts/et-book', {
          family: 'ET Book',
          variable: false,
          weights: [400],
          fileForStatic: ({ dir }) => `${dir}/et-book-roman-old-style-figures.woff`,
        });
        const b = WebFont.inject('/fonts/et-book', {
          family: 'ET Book',
          variable: false,
          weights: [400],
          fileForStatic: ({ dir }) => `${dir}/et-book-roman-old-style-figures.woff`,
        });

        expect(a.injected).to.eql(true);
        expect(b.injected).to.eql(false);
        expect(q('style[data-sys-fonts="ET Book"]').length).to.eql(1);
        expect(document.getElementById(a.id)).to.not.eql(null);
      });

      it('different keys (e.g., dir) → separate style tags', () => {
        resetHead();
        WebFont.inject('/fonts/a', { family: 'Foo', variable: true });
        WebFont.inject('/fonts/b', { family: 'Foo', variable: true });
        expect(q('style[data-sys-fonts="Foo"]').length).to.eql(2);
      });
    });

    describe('static fonts', () => {
      beforeEach(() => resetHead());

      it('regular 400 only', () => {
        const res = WebFont.inject('/fonts/et-book', {
          family: 'ET Book',
          variable: false,
          weights: [400],
          fileForStatic: ({ dir }) => `${dir}/et-book-roman-old-style-figures.woff`,
        });
        const style = document.getElementById(res.id) as HTMLStyleElement;
        expect(style).to.not.eql(null);
        const css = style.textContent ?? '';

        expect(css.includes('@font-face')).to.eql(true);
        expect(css.includes('font-family: "ET Book";')).to.eql(true);
        expect(css.includes('font-style: normal;')).to.eql(true);
        expect(css.includes('font-weight: 400;')).to.eql(true);
        // .woff → format("woff"), unquoted url(...)
        expect(
          css.includes(
            'src: url(/fonts/et-book/et-book-roman-old-style-figures.woff) format("woff");',
          ),
        ).to.eql(true);
      });

      it('weights + italic produce multiple blocks with correct styles', () => {
        const res = WebFont.inject('/fonts/et-book', {
          family: 'ET Book',
          variable: false,
          weights: [400, 600, 700],
          italic: true,
          fileForStatic: ({ dir, weight, italic }) => {
            if (weight === 400 && !italic) return `${dir}/et-book-roman-old-style-figures.woff`;
            if (weight === 400 && italic)
              return `${dir}/et-book-display-italic-old-style-figures.woff`;
            if (weight === 600 && !italic) return `${dir}/et-book-semi-bold-old-style-figures.woff`;
            if (weight === 700 && !italic) return `${dir}/et-book-bold-line-figures.woff`;
            return `${dir}/et-book-roman-line-figures.woff`;
          },
        });

        const css = (document.getElementById(res.id) as HTMLStyleElement).textContent ?? '';

        // Robust count of @font-face blocks
        const blocks = (css.match(/@font-face\s*\{/g) ?? []).length;
        expect(blocks).to.eql(6);

        expect(css.includes('font-weight: 400;')).to.eql(true);
        expect(css.includes('font-weight: 600;')).to.eql(true);
        expect(css.includes('font-weight: 700;')).to.eql(true);
        expect(css.includes('font-style: italic;')).to.eql(true);

        // Filenames appear
        expect(css.includes('et-book-roman-old-style-figures.woff')).to.eql(true);
        expect(css.includes('et-book-display-italic-old-style-figures.woff')).to.eql(true);
        expect(css.includes('et-book-semi-bold-old-style-figures.woff')).to.eql(true);
        expect(css.includes('et-book-bold-line-figures.woff')).to.eql(true);
      });

      it('local() sources precede url()', () => {
        const res = WebFont.inject('/fonts/et-book', {
          family: 'ET Book',
          variable: false,
          weights: [400],
          local: ['ETBook-Roman', 'ETBook'],
          fileForStatic: ({ dir }) => `${dir}/et-book-roman-old-style-figures.woff`,
        });
        const css = (document.getElementById(res.id) as HTMLStyleElement).textContent ?? '';

        const srcLine = css.split('\n').find((l) => l.trim().startsWith('src:')) ?? '';
        const firstLocalIdx = srcLine.indexOf('local(ETBook-Roman)');
        const urlIdx = srcLine.indexOf('url(/fonts/et-book/et-book-roman-old-style-figures.woff)');

        expect(firstLocalIdx).to.be.greaterThan(-1);
        expect(urlIdx).to.be.greaterThan(-1);
        expect(firstLocalIdx).to.be.lessThan(urlIdx); // local before url
      });

      it('sanitizes trailing slashes in dir (default naming)', () => {
        // Use defaults to exercise sanitizeDir (no override).
        const res = WebFont.inject('/fonts/et-book///', {
          family: 'Foo',
          variable: false,
          weights: [400],
        });
        const css = (document.getElementById(res.id) as HTMLStyleElement).textContent ?? '';
        // Default static path: /fonts/et-book/Foo-400.woff2 (unquoted url)
        expect(css.includes('url(/fonts/et-book/Foo-400.woff2)')).to.eql(true);
      });
    });

    describe('variable fonts', () => {
      beforeEach(() => resetHead());

      it('variable (normal) emits weight range 100 900', () => {
        const res = WebFont.inject('/fonts/inter', {
          family: 'Inter',
          variable: true,
          fileForVariable: ({ dir }) => `${dir}/Inter-Var.woff2`,
        });
        const css = (document.getElementById(res.id) as HTMLStyleElement).textContent ?? '';

        expect(css.includes('font-weight: 100 900;')).to.eql(true);
        expect(css.includes('font-style: normal;')).to.eql(true);
        expect(css.includes('url(/fonts/inter/Inter-Var.woff2) format("woff2")')).to.eql(true);
      });

      it('variable italic emits both normal and italic faces', () => {
        const res = WebFont.inject('/fonts/inter', {
          family: 'Inter',
          variable: true,
          italic: true,
          fileForVariable: ({ dir, italic }) => {
            return italic ? `${dir}/Inter-VarItalic.woff2` : `${dir}/Inter-Var.woff2`;
          },
        });
        const css = (document.getElementById(res.id) as HTMLStyleElement).textContent ?? '';

        const blocks = (css.match(/@font-face\s*\{/g) ?? []).length;
        expect(blocks).to.eql(2);

        expect(css.includes('font-weight: 100 900;')).to.be.true;
        expect(css.includes('font-style: normal;')).to.be.true;
        expect(css.includes('font-style: italic;')).to.be.true;
        expect(css.includes('url(/fonts/inter/Inter-Var.woff2) format("woff2")')).to.be.true;
        expect(css.includes('url(/fonts/inter/Inter-VarItalic.woff2) format("woff2")')).to.be.true;
      });
    });

    describe('display and id stability', () => {
      beforeEach(() => resetHead());

      it('font-display defaults to swap; can be overridden', () => {
        const a = WebFont.inject('/fonts/a', { family: 'A', variable: true });
        const cssA = (document.getElementById(a.id) as HTMLStyleElement).textContent ?? '';
        expect(cssA.includes('font-display: swap;')).to.eql(true);

        const b = WebFont.inject('/fonts/b', { family: 'B', variable: true, display: 'optional' });
        const cssB = (document.getElementById(b.id) as HTMLStyleElement).textContent ?? '';
        expect(cssB.includes('font-display: optional;')).to.eql(true);
      });

      it('stable id for same (dir, opts) tuple', () => {
        const x1 = WebFont.inject('/fonts/x', { family: 'X', variable: true });
        resetHead();
        const x2 = WebFont.inject('/fonts/x', { family: 'X', variable: true });
        expect(x1.id).to.eql(x2.id);
      });
    });
  });

  describe('Webfont.def', () => {
    const ET_BOOK: t.WebFontConfig = {
      family: 'ET Book',
      variable: false,
      weights: [400, 600, 700],
      italic: true,
      local: ['ETBook-Roman', 'ETBook-Italic', 'ETBook-SemiBold', 'ETBook-Bold'],
      fileForStatic: ({ dir, family, weight, italic }) => {
        // Example: matching filenames exactly:
        if (weight === 400 && !italic) return `${dir}/et-book-roman-old-style-figures.woff`;
        if (weight === 400 && italic) return `${dir}/et-book-display-italic-old-style-figures.woff`;
        if (weight === 600 && !italic) return `${dir}/et-book-semi-bold-old-style-figures.woff`;
        if (weight === 700 && !italic) return `${dir}/et-book-bold-line-figures.woff`;
        return `${dir}/et-book-roman-line-figures.woff`; // fallback
      },
    };

    it("curry's the font options", () => {
      const a = WebFont.def(ET_BOOK);
      const b = WebFont.def(a);

      expect(a).to.eql(b);
      expect(b).to.eql(ET_BOOK);
      expect(a).to.not.equal(ET_BOOK);
    });
  });
});

/**
 * Helpers:
 */
const q = (sel: string) => document.querySelectorAll(sel);
function resetHead() {
  const nodes = Array.from(document.querySelectorAll(`style[${D.attr.data}]`));
  nodes.forEach((n) => n.parentElement?.removeChild(n));
}
