import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Color, Is, Style } from '../common.ts';
import { Bullet } from '../mod.ts';

// Paint declarations only; visual prominence needs a real browser.
describe('Bullet border opacity', () => {
  DomMock.init({ beforeAll, afterAll });

  it('16% default and explicit overrides, including zero → border-only paint in both themes', async () => {
    for (const theme of ['Light', 'Dark'] as const) {
      const palette = Color.theme(theme);
      const res = await TestReact.render(
        <>
          <Bullet theme={theme} />
          <Bullet theme={theme} borderOpacity={0} />
          <Bullet theme={theme} borderOpacity={0.6} />
          <Bullet theme={theme} borderOpacity={0.6} filled />
          <Bullet theme={theme} borderOpacity={0.6} selected />
        </>,
      );
      try {
        const paints = [...res.container.children].map((el) => paint(el.firstElementChild!));
        expect(paints.map((style) => style.border)).to.eql(
          [0.16, 0, 0.6, 0.6, 0.6].map((alpha) => `solid 1px ${Color.alpha(palette.fg, alpha)}`),
        );
        expect(paints.map((style) => style.backgroundColor)).to.eql([
          palette.bg,
          palette.bg,
          palette.bg,
          Color.alpha(palette.fg, 0.16),
          Color.BLUE,
        ]);
      } finally {
        React.act(() => res.dispose());
      }
    }
  });
});

/** Inspect the emitted paint without depending on mock CSS color normalization. */
function paint(el: Element) {
  const rule = Style.Dom.stylesheet().rules.items.find(({ selector }) => {
    return selector === `.${el.className}`;
  });
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${el.className}`);
  return rule.style;
}
