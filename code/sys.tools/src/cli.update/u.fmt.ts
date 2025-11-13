import { Fmt as Base, c, D, Str } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname) {
    const base = await Base.help(toolname, (e) => e.row(c.gray(`@sys/tools/${c.white('update')}`)));
    return `${base}\n${Fmt.shellcommand()}`;
  },

  shellcommand() {
    const str = Str.builder();
    const a = 'sys update --latest';
    const b = 'deno run -A jsr:@sys/tools/update --latest';
    str
      .line(c.gray('To update to latest run:'))
      .line()
      .line(c.italic(c.yellow(`  ${a}`)))
      .line(c.gray('    or'))
      .line(c.italic(c.yellow(`  ${b}`)))
      .line();
    return String(str);
  },
} as const;
