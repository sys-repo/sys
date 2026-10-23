import { Str, type t } from './common.ts';

const PATHS: readonly t.Shell.Path.Entry[] = [
  {
    id: 'deno',
    label: 'Deno bin',
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
export const Path: t.Shell.Path.Lib = Object.freeze({
  list: () => PATHS,
  get: (id) => PATHS.find((entry) => entry.id === id),
});
