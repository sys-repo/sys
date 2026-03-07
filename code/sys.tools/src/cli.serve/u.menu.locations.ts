import { type t, Fs } from './common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { ServeFs, ServeYamlSchema } from './u.yaml/mod.ts';

export type ServeLocationsMenuPick =
  | { readonly kind: 'exit' }
  | { readonly kind: 'selected'; readonly key: string };

type Action = 'select';

/**
 * Name validity for a serve location.
 */
const ValidName = {
  hint: 'letters, numbers, ".", "_" or "-"',
  test(name: string) {
    return /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/.test(name);
  },
} as const;

/**
 * Root menu for selecting (or adding) a remembered serve location.
 *
 * Owns only:
 * - selection
 * - creation (via YamlConfig.menu add handler)
 */
export async function serveLocationsMenu(cwd: t.StringDir): Promise<ServeLocationsMenuPick> {
  const schema = {
    init: () => ServeYamlSchema.initial(),
    validate: (value: unknown) => ServeYamlSchema.validate(value),
  } as const;

  const res = await YamlConfig.menu<t.ServeTool.LocationYaml.Doc, Action>({
    cwd,
    dir: ServeFs.dir,
    label: 'Serve Locations',
    itemLabel: 'serve',
    addLabel: '   add: <location>',
    ensureDefault: false,
    schema,
    mode: 'select',
    selectAction: 'select',
    add: {
      message: 'Location name',
      hint: ValidName.hint,
      validate(value) {
        if (!ValidName.test(value)) return ValidName.hint;
        return true;
      },
      initYaml: ({ name }) => ServeFs.initialYaml(name),
    },
  });

  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind !== 'action' || res.action !== 'select') return { kind: 'exit' };

  return { kind: 'selected', key: nameFromPath(res.path) };
}

function nameFromPath(path: t.StringPath): string {
  const base = Fs.basename(path);
  return base.endsWith(ServeFs.ext) ? base.slice(0, -ServeFs.ext.length) : base;
}
