import { pkg } from '../pkg.ts';
import { c, Fs, Pkg } from './libs.ts';
import * as t from './t.ts';

export const Fmt = {
  builder,
  async header(toolname: string, dir: t.StringDir) {
    return builder()
      .line(c.gray(`${c.green(toolname)} v${pkg.version}`))
      .line(c.gray(await Fs.Fmt.treeFromDir(dir, { indent: 2 })))
      .toString();
  },

  signoff(toolname: string) {
    return builder()
      .line(c.dim(`${Pkg.toString(pkg)}:${toolname}`))
      .toString();
  },
} as const;

/**
 * Helpers:
 */
function builder() {
  let text = '';
  const api = {
    toString: () => text.trimEnd(),
    line(input: string = '') {
      text += `${input}\n`;
      return api;
    },
  } as const;
  return api;
}
