import { Str, type t } from './common.ts';

const PATHS: readonly t.Shell.PathEntry[] = [
  {
    id: 'deno',
    label: 'deno',
    expression: Str.dedent(`
      export DENO_INSTALL="\${DENO_INSTALL:-$HOME/.deno}"
      case ":$PATH:" in
        *":$DENO_INSTALL/bin:"*) ;;
        *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
      esac
    `).trim(),
  },
];

/** PATH catalog helpers. */
export const Path: t.Shell.Path.Lib = {
  list: () => PATHS,
  get: (id) => PATHS.find((entry) => entry.id === id),
};
