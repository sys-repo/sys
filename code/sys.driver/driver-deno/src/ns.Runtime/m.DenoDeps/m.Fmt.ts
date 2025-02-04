import { type t, c, Cli } from './common.ts';

export const Fmt: t.DenoDepsFmt = {
  deps(deps) {
    if (!deps) return '';

    const table = Cli.table([]);
    deps.forEach((dep) => {
      const mod = dep.module;
      const registry = mod.prefix === 'jsr' ? 'jsr' : mod.prefix || 'npm';

      const [left, right] = mod.name.split('/');
      const name = right ? right : left;
      const scope = right ? `${left}/` : '';

      const fmtRegistry = ` ${c.gray(registry.toUpperCase())}`;
      const fmtName = c.gray(`${scope}${c.white(name)}`);
      const fmtVersion = c.green(mod.version);
      table.push([fmtName, fmtVersion, fmtRegistry]);
    });

    return table.toString().trim();
  },
};
