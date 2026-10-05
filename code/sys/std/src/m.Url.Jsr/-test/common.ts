import { c } from '../../-test.ts';

export { c, describe, expect, it } from '../../-test.ts';
export { JsrUrl } from '../mod.ts';

export const formatUrl = (url: string, matchEnd: string) => {
  if (!url.endsWith(matchEnd)) return url;
  const left = url.slice(0, 0 - matchEnd.length);
  const right = c.bold(c.cyan(matchEnd));
  return `${left}${right}`;
};

export const print = (title: string, url: string) => {
  url = url.replace(/https:\/\/jsr.io\//, c.gray('https://jsr.io/'));
  console.info();
  console.info(c.cyan(`${title}:`));
  console.info(`  ${url}`);
  console.info();
};
