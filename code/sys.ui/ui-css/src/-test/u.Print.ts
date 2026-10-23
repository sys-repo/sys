import { type t, c, Str } from './common.ts';

const info = console.info;
const cyan = c.brightCyan;
const y = c.yellow;

export const TestPrint = {
  transformed(m: t.Style.Transform.Result) {
    info();
    info(cyan(`Style.Transform.Result:`));
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

  container(m: t.CssDom.Container.Block) {
    info();
    info(cyan(`CssDom.Container.Block:`));
    info(m);
    info(`↑.${cyan('toString()')}:`, `"${y(m.toString())}" ${c.gray('← default: QueryCondition')}`);
    info(
      `↑.${cyan('toString(CssSelector)')}:`,
      `"${y(Str.truncate(m.toString('CssSelector'), 50))}"`,
    );
    info();
  },
};
