import { Fmt as Base, Cli, Str, c, pkg } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = 'Clipboard Tools') {
    const table = Cli.table([]);

    const gr = c.gray;
    // table.push([gr(` ├─ ${pkg.name}`), pkg.version]);
    table.push([gr(` └─ ${pkg.name}`), pkg.version]);

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(toolname)} `))
      .line(table.toString().trim())
      .line()
      .toString();
  },
} as const;
