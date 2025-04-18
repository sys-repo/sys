import { type t, c, Str } from './common.ts';

const info = console.info;
const cyan = c.brightCyan;
const y = c.yellow;

export const TestPrint = {
  transformed(m: t.CssTransformed) {
    info();
    info(cyan(`CssTransformed:`));
    info(m);
    info();
    info(`↑.${cyan('style')}:`, m.style);
    info(`↑.${cyan('class')}:`, `"${y(m.class)}"`);
    info(`↑.${cyan('toString()')}:`, `"${y(m.toString())}" ${c.gray('← default: CssRule')}`);
    info(
      `↑.${cyan('toString(CssSelector)')}:`,
      `"${y(Str.truncate(m.toString('CssSelector'), 60))}"`,
    );
    info();
  },

  container(m: t.CssDomContainerBlock) {
    info();
    info(cyan(`CssDomContainerBlock:`));
    info(m);
    info(`↑.${cyan('toString()')}:`, `"${y(m.toString())}" ${c.gray('← default: QueryCondition')}`);
    info(
      `↑.${cyan('toString(CssSelector)')}:`,
      `"${y(Str.truncate(m.toString('CssSelector'), 50))}"`,
    );
    info();
  },
};
