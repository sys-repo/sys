import { type t, c } from './common.ts';

export const TestPrint = {
  transformed(m: t.CssTransformed) {
    console.info();
    console.info(c.brightCyan(`CssTransform:`));
    console.info(m);
    console.info();
    console.info(`↑.${c.brightCyan('style')}:`, m.style);
    console.info(`↑.${c.brightCyan('class')}:`, `"${c.yellow(m.class)}"`);
    console.info(`↑.${c.brightCyan('toString')}:`, `"${c.yellow(m.toString())}"`);
    console.info();
  },
};
