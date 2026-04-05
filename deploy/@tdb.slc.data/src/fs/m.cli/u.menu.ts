import { c, Cli, type t, YamlConfig } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { StageProfilePaths } from './u.fs.ts';
import { MountName } from './u.is.ts';
import { readProfile, runStageProfileMapping } from './u.stage.ts';

type Action = `stage:${number}` | 'select';
const ACTION_WIDTH = 'stage'.length;

const schema = {
  validate: (value: unknown) => StageProfileSchema.validate(value),
  stringifyYaml: (doc: t.SlcDataCli.StageProfile.Doc) => StageProfileSchema.stringify(doc),
} as const;

/**
 * Interactive menu for staging SLC data profiles.
 */
export async function menu(cwd: t.StringDir, target?: t.StringDir): Promise<t.SlcDataCli.Menu.Result> {
  while (true) {
    const selected = await YamlConfig.menu<t.SlcDataCli.StageProfile.Doc, Action>({
      cwd,
      dir: StageProfilePaths.dir,
      ext: StageProfilePaths.ext,
      label: 'Staging profiles',
      itemLabel: 'stage',
      addLabel: '  add: <profile>',
      ensureDefault: false,
      schema,
      invalid: { label: 'invalid yaml' },
      mode: 'select',
      selectAction: 'select',
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

    if (selected.kind === 'exit') return { kind: 'exit' };
    if (selected.kind !== 'action' || selected.action !== 'select') return { kind: 'back' };

    let path = selected.path;
    while (true) {
      let doc: t.SlcDataCli.StageProfile.Doc;
      try {
        doc = await readProfile(path);
      } catch (error) {
        console.error(Fmt.error(error));
        console.info();
        break;
      }

      const action = await YamlConfig.menu<t.SlcDataCli.StageProfile.Doc, Action>({
        cwd,
        dir: StageProfilePaths.dir,
        ext: StageProfilePaths.ext,
        label: 'Staging profiles',
        itemLabel: 'stage',
        addLabel: '  add: <profile>',
        ensureDefault: false,
        schema,
        invalid: { label: 'invalid yaml' },
        mode: 'action',
        path,
        actions: { extra: extraActions(doc) },
      });

      if (action.kind === 'exit') return { kind: 'exit' };
      if (action.kind === 'back') break;
      if (action.kind === 'stay') continue;
      path = action.path;
      if (!action.action.startsWith('stage:')) continue;

      const index = Number(action.action.slice('stage:'.length));
      try {
        const result = await runStageProfileMapping({ cwd, path: action.path, index, target });
        console.info(result);
      } catch (error) {
        console.error(Fmt.error(error));
      }
      console.info();
    }
  }
}

function extraActions(
  doc: t.SlcDataCli.StageProfile.Doc,
): { name: ({ name, doc }: { name: string; doc?: t.SlcDataCli.StageProfile.Doc }) => string; value: Action }[] {
  return doc.mappings.map((mapping, index) => ({
    name: () => {
      const verb = 'stage'.padEnd(ACTION_WIDTH, ' ');
      const mount = Cli.Fmt.path(`/${mapping.mount}`, (e) => {
        if (e.is.basename) e.change(c.cyan(e.part));
      });
      return `${verb}   ${mount}`;
    },
    value: `stage:${index}` as Action,
  }));
}
