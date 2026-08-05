import { c, Fs, Is, type t, YamlConfig } from '../common.ts';
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

type ConfigSnapshot = {
  readonly path: t.StringPath;
  readonly text: string;
};

type PreviewToken = ConfigSnapshot & t.PiCliProfiles.MenuPreview;

type ProfileScreen =
  | {
    readonly kind: 'invalid';
    readonly allowAll?: boolean;
  }
  | {
    readonly kind: 'sandbox';
    readonly gitRootExplicit: boolean;
    readonly preview?: PreviewToken;
    readonly sheet: t.PiCliProfiles.MenuPreview;
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
    const selected = await YamlConfig.menu<t.PiCliProfiles.Yaml.Profile, Action>({
      ...menuArgs({ cwd: root, allowAll }),
      mode: 'select',
      selectAction: 'select',
      beforePrompt() {
        printProfileRoot({ allowAll, notice: rootNotice });
        rootNotice = undefined;
      },
    });

    if (selected.kind === 'exit') return { kind: 'exit' };
    if (selected.kind !== 'action' || selected.action !== 'select') return { kind: 'exit' };

    const selectedCheck = await ProfilesFs.validateYaml(selected.path);
    const screen: ProfileScreen = selectedCheck.ok
      ? await prepareSandboxScreen({
        cwd,
        path: selected.path,
        allowAll,
        gitRootExplicit,
      })
      : { kind: 'invalid', allowAll };

    const action = await YamlConfig.menu<t.PiCliProfiles.Yaml.Profile, Action>({
      ...menuArgs({ cwd: root, allowAll }),
      mode: 'action',
      path: selected.path,
      defaultAction: 'run',
      beforePrompt: () => printProfileScreen(screen),
    });

    if (action.kind === 'back') continue;
    if (action.kind === 'exit') return { kind: 'exit' };
    if (action.kind === 'action' && action.action === 'run') {
      return {
        kind: 'selected',
        config: action.path,
        preview: await currentPreview(screen, action.path),
      };
    }
  }
};

/**
 * Helpers:
 */
function printProfileRoot(input: { allowAll?: boolean; notice?: string }) {
  clearInteractiveScreen();
  printProfileHeader(input.allowAll);
  if (input.notice) console.info(input.notice);
  console.info('');
}

function printProfileHeader(allowAll?: boolean) {
  const permissions = allowAll === true ? 'allow-all' : 'scoped';
  console.info(PiSandboxFmt.header(permissions).join('\n'));
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
      message: false as const,
      label: ({ name }: { name: string }) => `profile: ${c.cyan(name)}`,
      labelMode: 'submenu' as const,
      extra: [
        {
          name: allowAll === true
            ? `${c.cyan('start')}${c.dim(c.yellow(' (--allow-all)'))}`
            : c.cyan('start'),
          value: 'run' as const,
        },
      ],
      onAction({ action, path }: { action: string; path: t.StringPath }) {
        if (action === 'run') {
          return Promise.resolve({ kind: 'action' as const, action: 'run' as const, path });
        }
        if (action === 'select') {
          return Promise.resolve({ kind: 'action' as const, action: 'select' as const, path });
        }
        return Promise.resolve({ kind: 'exit' as const });
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

async function prepareSandboxScreen(args: MenuContext): Promise<ProfileScreen> {
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
  const sheet = { sandbox: resolved.sandbox, report };
  const snapshot = await snapshotConfig(args.path);
  return {
    kind: 'sandbox',
    gitRootExplicit: args.gitRootExplicit === true,
    sheet,
    preview: snapshot ? { ...snapshot, ...sheet } : undefined,
  };
}

function printProfileScreen(input: ProfileScreen) {
  clearInteractiveScreen();
  if (input.kind === 'invalid') {
    printProfileHeader(input.allowAll);
    return;
  }
  console.info(
    PiSandboxFmt.table({ ...input.sheet.sandbox, report: input.sheet.report }, {
      gitRootExplicit: input.gitRootExplicit,
    }),
  );
}

async function currentPreview(
  screen: ProfileScreen,
  path: t.StringPath,
): Promise<t.PiCliProfiles.MenuPreview | undefined> {
  if (screen.kind !== 'sandbox') return undefined;
  const preview = screen.preview;
  if (Is.nil(preview)) return undefined;
  if (preview.path !== path) return undefined;
  const current = await snapshotConfig(path);
  if (current?.text !== preview.text) return undefined;
  return { sandbox: preview.sandbox, report: preview.report };
}

async function snapshotConfig(path: t.StringPath): Promise<ConfigSnapshot | undefined> {
  const read = await Fs.readText(path);
  if (!read.ok) return undefined;
  return { path, text: read.data ?? '' };
}
