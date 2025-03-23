import { type t, c, Str } from './common.ts';

export const TestPrint = {
  transformed(m: t.CssTransformed) {
    const cyan = c.brightCyan;
    const y = c.yellow;

    const info = console.info;

    info();
    info(cyan(`CssTransform:`));
    info(m);
    info();
    info(`↑.${cyan('style')}:`, m.style);
    info(`↑.${cyan('class')}:`, `"${y(m.class)}"`);
    info(`↑.${cyan('toString()')}:`, `"${y(m.toString())}" ${c.gray('← default: CssRule')}`);
    info(
      `↑.${cyan('toString(CssSelector)')}:`,
      `"${y(Str.truncate(m.toString('CssSelector'), 50))}"`,
    );
    info();
  },
};
