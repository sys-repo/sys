import { Fmt as Base, Cli, Str, c, pkg } from './common.ts';

export const Fmt = {
  ...Base,

  async help() {
    const cmd = Base.invoke('copy');
    const table = Cli.table([]);

    const gr = c.gray;
    // table.push([gr(` ├─ ${pkg.name}`), pkg.version]);
    table.push([gr(` └─ ${pkg.name}`), pkg.version]);

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(cmd)} `))
      .line(table.toString().trim())
      .line()
      .toString();
  },
} as const;
