import { c, Cli, type t, YamlConfig } from './common.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { StageProfilePaths } from './u.fs.ts';
import { MountName } from './u.is.ts';
import { runStageProfile } from './u.stage.ts';

type Action = 'stage';
const ACTION_WIDTH = 'stage'.length;

const schema = {
  validate: (value: unknown) => StageProfileSchema.validate(value),
  stringifyYaml: (doc: t.SlcDataCli.StageProfile.Doc) => StageProfileSchema.stringify(doc),
} as const;

/**
 * Interactive menu for staging SLC data profiles.
 */
export async function menu(cwd: t.StringDir, target?: t.StringDir): Promise<t.SlcDataCli.Menu.Result> {
  const res = await YamlConfig.menu<t.SlcDataCli.StageProfile.Doc, Action>({
    cwd,
    dir: StageProfilePaths.dir,
    ext: StageProfilePaths.ext,
    label: 'Staging profiles',
    itemLabel: 'stage',
    addLabel: '  add: <profile>',
    ensureDefault: false,
    schema,
    invalid: { label: 'invalid yaml' },
    actions: {
      extra: [{
        name: ({ name, doc }) => {
          const verb = 'stage'.padEnd(ACTION_WIDTH, ' ');
          const mount = Cli.Fmt.path(`/${doc?.mount ?? name}`, (e) => {
            if (e.is.basename) e.change(c.cyan(e.part));
          });
          return `${verb}   ${mount}`;
        },
        value: 'stage',
      }],
    },
    add: {
      message: 'Mount name',
      hint: MountName.hint,
      validate(value) {
        if (!MountName.test(value)) return MountName.hint;
        return true;
      },
      initYaml: ({ name }) => StageProfileSchema.initialYaml(name as t.StringId),
    },
    itemValue: ({ name }) => name,
  });

  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind === 'back') return { kind: 'back' };
  if (res.kind !== 'action' || res.action !== 'stage') return { kind: 'back' };

  return runStageProfile({ cwd, path: res.path, target });
}
