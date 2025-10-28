import { pkg } from '../pkg.ts';
import { c, Fs, Pkg, Str } from './libs.ts';
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
    const self = `${Pkg.toString(pkg)}:${toolname}`;
    return builder().line(c.dim(self)).toString();
  },
} as const;

/**
 * Helpers:
 */

function builder() {
  let _text = '';
  const api = {
    toString: () => _text.trimEnd(),
    line(input: string = Str.SPACE) {
      _text += `${input}\n`;
      return api;
    },
  } as const;
  return api;
}
