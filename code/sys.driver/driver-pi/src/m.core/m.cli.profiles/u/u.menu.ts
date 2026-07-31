import { c, Cli, Fs, type t, YamlConfig } from '../common.ts';
import { PiSandboxFmt } from '../../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../../m.cli/u.report.sandbox.ts';
import { runtimeRoot } from '../../m.cli/u.runtime.ts';
import { ProfilesFs } from './u.fs.ts';
import { ProfileMigrate } from '../u.migrate/mod.ts';
import { resolveRun } from './u.resolve.run.ts';
import { ProfileSchema } from '../u.schema/mod.ts';
import { clearInteractiveScreen } from './u.terminal.ts';

type Action = 'run' | 'select';

type MenuContext = {
  readonly cwd: t.PiCli.Cwd;
  readonly path: t.StringPath;
  readonly allowAll?: boolean;
  readonly gitRootExplicit?: boolean;
};

type PreviewToken = {
  readonly path: t.StringPath;
  readonly text: string;
};

const ValidName = {
  hint: 'letters, numbers, ".", "_" or "-"',
  test(name: string) {
    return /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/.test(name);
  },
} as const;

export const menu: t.PiCliProfiles.Lib['menu'] = async ({ cwd, allowAll, gitRootExplicit }) => {
  const root = runtimeRoot(cwd);
  const migration = await ProfileMigrate.dir(root);
  let rootNotice = ProfileMigrate.message(migration);

  while (true) {
    printProfileRoot(rootNotice);
    rootNotice = undefined;
    const selected = await YamlConfig.menu<t.PiCliProfiles.Yaml.Profile, Action>({
      ...menuArgs({ cwd: root, allowAll }),
      mode: 'select',
      selectAction: 'select',
    });

    if (selected.kind === 'exit') return { kind: 'exit' };
    if (selected.kind !== 'action' || selected.action !== 'select') return { kind: 'exit' };

    const selectedCheck = await ProfilesFs.validateYaml(selected.path);
    clearInteractiveScreen();
    let preview: PreviewToken | undefined;
    if (selectedCheck.ok) {
      preview = await printSandbox({
        cwd,
        path: selected.path,
        allowAll,
        gitRootExplicit,
      });
    } else {
      printProfileTitle();
    }

    const action = await YamlConfig.menu<t.PiCliProfiles.Yaml.Profile, Action>({
      ...menuArgs({ cwd: root, allowAll }),
      mode: 'action',
      path: selected.path,
      defaultAction: 'run',
    });

    if (action.kind === 'back') continue;
    if (action.kind === 'exit') return { kind: 'exit' };
    if (action.kind === 'action' && action.action === 'run') {
      return {
        kind: 'selected',
        config: action.path,
        previewed: await isPreviewCurrent(preview, action.path),
      };
    }
  }
};

/**
 * Helpers:
 */
function printProfileRoot(notice?: string) {
  clearInteractiveScreen();
  printProfileTitle();
  if (notice) console.info(notice);
}

function printProfileTitle() {
  console.info(PiSandboxFmt.title('scoped'));
}

function menuArgs(args: { cwd: t.StringDir; allowAll?: boolean }) {
  const { cwd, allowAll } = args;
  const schema = {
    init: () => ProfileSchema.initial(),
    validate: (value: unknown) => ProfileSchema.validate(value),
  } as const;

  return {
    cwd,
    dir: ProfilesFs.dir,
    label: '',
    itemLabel: 'profile',
    addLabel: ' add: <profile>',
    defaultName: 'default',
    schema,
    actions: {
      message: '',
      label: 'profile',
      extra: [
        {
          name: allowAll === true
            ? `${c.cyan('start')}${c.dim(c.yellow(' (--allow-all)'))}`
            : c.cyan('start'),
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
      initYaml: () => ProfilesFs.initialYaml(),
    },
  };
}

async function printSandbox(args: MenuContext): Promise<PreviewToken | undefined> {
  const root = runtimeRoot(args.cwd);
  const resolved = await resolveRun({
    cwd: args.cwd,
    config: args.path,
    allowAll: args.allowAll,
    ocr: { preflight: false },
  });
  const report = await PiSandboxReport.write({
    cwd: root,
    sandbox: resolved.sandbox,
    gitRootExplicit: args.gitRootExplicit === true,
  });
  console.info(
    PiSandboxFmt.table({ ...resolved.sandbox, report }, {
      gitRootExplicit: args.gitRootExplicit === true,
    }),
  );
  return await snapshotConfig(args.path);
}

async function isPreviewCurrent(preview: PreviewToken | undefined, path: t.StringPath) {
  if (!preview) return false;
  if (preview.path !== path) return false;
  const current = await snapshotConfig(path);
  return current?.text === preview.text;
}

async function snapshotConfig(path: t.StringPath): Promise<PreviewToken | undefined> {
  const read = await Fs.readText(path);
  if (!read.ok) return undefined;
  return { path, text: read.data ?? '' };
}
