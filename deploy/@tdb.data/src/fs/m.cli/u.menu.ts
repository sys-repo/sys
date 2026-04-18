import { c, Cli, type t, YamlConfig } from './common.ts';
import type { YamlConfigMenuExtra, YamlConfigMenuItemArgs } from '@sys/yaml/t';
import { SlugDataPipeline } from '../m.DataPipeline/mod.ts';
import { Fmt } from './u.fmt.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { StageProfileFs, StageProfilePaths } from './u.fs.ts';
import { MountName } from './u.is.ts';
import { readProfile, runStageProfileMapping } from './u.stage.ts';
import { withStageSpinner } from './u.spin.ts';

type Action = `stage:${number}` | 'refresh' | 'select';

const schema = {
  validate: (value: unknown) => StageProfileSchema.validate(value),
  stringifyYaml: (doc: t.SlugDataCli.StageProfile.Doc) => StageProfileSchema.stringify(doc),
} as const;

/**
 * Interactive menu for staging data profiles.
 */
export async function menu(
  cwd: t.StringDir,
  target?: t.StringDir,
): Promise<t.SlugDataCli.Menu.Result> {
  while (true) {
    const selected = await YamlConfig.menu<t.SlugDataCli.StageProfile.Doc, Action>({
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
      let doc: t.SlugDataCli.StageProfile.Doc;
      try {
        doc = await readProfile(path);
      } catch (error) {
        console.error(Fmt.error(error));
        console.info();
        break;
      }

      const action = await YamlConfig.menu<t.SlugDataCli.StageProfile.Doc, Action>({
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
      if (action.action === 'refresh') {
        try {
          const root = target ?? StageProfileFs.targetRoot(cwd);
          const result = await Cli.Spinner.with(
            Fmt.spinnerText('refreshing staged root...'),
            () => SlugDataPipeline.refreshRoot({ root }),
          );
          console.info(Fmt.refreshRoot(result));
        } catch (error) {
          console.error(Fmt.error(error));
        }
        console.info();
        continue;
      }
      if (!action.action.startsWith('stage:')) continue;

      const index = Number(action.action.slice('stage:'.length));
      try {
        const result = await withStageSpinner((onProgress) =>
          runStageProfileMapping({ cwd, path: action.path, index, target, onProgress })
        );
        console.info(Fmt.staged(result));
      } catch (error) {
        console.error(Fmt.error(error));
      }
      console.info();
    }
  }
}

function extraActions(
  doc: t.SlugDataCli.StageProfile.Doc,
): YamlConfigMenuExtra<Action, t.SlugDataCli.StageProfile.Doc>[] {
  const actions = doc.mappings.map((mapping, index) => ({
    name: (_args: YamlConfigMenuItemArgs<t.SlugDataCli.StageProfile.Doc>) => {
      if (mapping.kind === 'slug-dataset') {
        const source = Cli.Fmt.path(compactPath(mapping.source), (e) => {
          if (e.is.basename) e.change(c.white(e.part));
          else e.change(c.gray(e.part));
        });
        return `stage   ${c.cyan('slug-dataset')}${c.gray(':')}${source}`;
      }
      const mount = Cli.Fmt.path(`/${mapping.mount}`, (e) => {
        if (e.is.basename) e.change(c.cyan(e.part));
      });
      return `stage   ${mount}`;
    },
    value: `stage:${index}` as Action,
  }));
  actions.push({ name: () => 'refresh', value: 'refresh' });
  return actions;
}

function compactPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const tail = parts.at(-1) ?? '';
  if (parts.length <= 2) return path;

  const prefix = path.startsWith('./') ? './' : '';
  return `${prefix}.../${tail}`;
}
