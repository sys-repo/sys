import { c, Cli, Fs, type t, YamlConfig } from './common.ts';
import { PiSandboxFmt } from '../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../m.cli/u.report.sandbox.ts';
import { ProfilesFs } from './u.fs.ts';
import { ProfileMigrate } from './u.migrate/mod.ts';
import { resolveRun } from './u.resolve.run.ts';
import { ProfileSchema } from './u.schema.ts';

type Action = 'run' | 'select';

type MenuContext = {
  readonly cwd: t.StringDir;
  readonly path: t.StringPath;
  readonly allowAll?: boolean;
};

const ValidName = {
  hint: 'letters, numbers, ".", "_" or "-"',
  test(name: string) {
    return /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/.test(name);
  },
} as const;

export const menu: t.PiCliProfiles.Lib['menu'] = async ({ cwd, allowAll }) => {
  await ProfileMigrate.dir(cwd);
  while (true) {
    const selected = await YamlConfig.menu<t.PiCliProfiles.Yaml.Profile, Action>({
      ...menuArgs({ cwd, allowAll }),
      mode: 'select',
      selectAction: 'select',
    });

    if (selected.kind === 'exit') return { kind: 'exit' };
    if (selected.kind !== 'action' || selected.action !== 'select') return { kind: 'exit' };

    await printSandbox({ cwd, path: selected.path, allowAll });

    const action = await YamlConfig.menu<t.PiCliProfiles.Yaml.Profile, Action>({
      ...menuArgs({ cwd, allowAll }),
      mode: 'action',
      path: selected.path,
      defaultAction: 'run',
    });

    if (action.kind === 'back') continue;
    if (action.kind === 'exit') return { kind: 'exit' };
    if (action.kind === 'action' && action.action === 'run') {
      return { kind: 'selected', config: action.path };
    }
  }
};

/**
 * Helpers:
 */
function menuArgs(args: { cwd: t.StringDir; allowAll?: boolean }) {
  const { cwd, allowAll } = args;
  const schema = {
    init: () => ProfileSchema.initial(),
    validate: (value: unknown) => ProfileSchema.validate(value),
  } as const;

  return {
    cwd,
    dir: ProfilesFs.dir,
    label: 'pi',
    itemLabel: 'profile',
    addLabel: ' add: <profile>',
    defaultName: 'default',
    schema,
    actions: {
      message: 'pi:',
      label: 'profile',
      extra: [
        {
          name: allowAll === true ? c.yellow('start (--allow-all)') : c.cyan('start'),
          value: 'run' as const,
        },
      ],
      async onAction({ action, path }: { action: string; path: t.StringPath }) {
        if (action === 'run') return { kind: 'action' as const, action: 'run' as const, path };
        if (action === 'select') {
          return { kind: 'action' as const, action: 'select' as const, path };
        }
        return { kind: 'exit' as const };
      },
    },
    add: {
      message: 'Profile name',
      hint: ValidName.hint,
      validate(value: string) {
        if (!ValidName.test(value)) return ValidName.hint;
        return true;
      },
      initYaml: ({ name }: { name: string }) => ProfilesFs.initialYaml(name),
    },
  };
}

async function printSandbox(args: MenuContext) {
  const resolved = await resolveRun({
    cwd: { invoked: args.cwd, git: args.cwd },
    config: args.path,
    allowAll: args.allowAll,
  });
  const report = await PiSandboxReport.write({ cwd: args.cwd, sandbox: resolved.sandbox });
  console.info(PiSandboxFmt.table({ ...resolved.sandbox, report }));
  console.info('');
}
