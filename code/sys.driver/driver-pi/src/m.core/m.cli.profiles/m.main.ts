import { run } from '../m.cli/m.run.ts';
import { PiSandboxFmt } from '../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../m.cli/u.report.sandbox.ts';
import { resolveCwd } from '../m.cli/u.resolve.cwd.ts';
import { runtimeRoot } from '../m.cli/u.runtime.ts';

import { Cli, Fs, type t, YamlConfig } from './common.ts';
import { ProfileArgs } from './u.args.ts';
import { ProfilesFmt } from './u.fmt.help.ts';
import { ProfilesFs } from './u.fs.ts';
import { menu } from './u.menu.ts';
import { ProfileMigrate } from './u.migrate/mod.ts';
import { resolveRun } from './u.resolve.run.ts';
import { clearInteractiveScreen } from './u.terminal.ts';

export const main: t.PiCliProfiles.Lib['main'] = async (input = {}) => {
  const parsed = ProfileArgs.parse(input.argv);

  if (parsed.help) {
    const text = ProfilesFmt.help();
    console.info(text);
    return { kind: 'help', input, text };
  }

  if (parsed.nonInteractive && !parsed.profile) {
    const err = 'Missing required flag: --profile <name|path> (required with --non-interactive).';
    throw new Error(err);
  }

  const tty = resolveTty(input);
  const canOpenProfileMenu = tty.stdin && tty.stdout;
  if (!parsed.profile && !canOpenProfileMenu) throw new Error(ProfileMenuNonTtyError);

  const resolvedCwd = await resolveCwd(input.cwd, {
    gitRoot: parsed.gitRoot,
    interactive: parsed.nonInteractive !== true && canOpenProfileMenu,
  });
  if (resolvedCwd.kind === 'exit') return { kind: 'exit', input };
  const cwd = resolvedCwd.cwd;
  const root = runtimeRoot(cwd);
  const allowAll = input.allowAll === true || parsed.allowAll === true;
  const gitRootExplicit = parsed.gitRoot !== undefined;

  const migration = await ProfileMigrate.dir(root);
  const migrationMessage = ProfileMigrate.message(migration);
  if (migrationMessage) console.info(migrationMessage);

  const selection = parsed.profile ? resolveProfileSelector(root, parsed.profile) : undefined;
  const picked = selection
    ? {
      kind: 'selected' as const,
      config: selection.config,
    }
    : await menu({ cwd, allowAll, gitRootExplicit });

  if (picked.kind === 'exit') return { kind: 'exit', input };

  if (selection?.kind === 'name') await prepareProfileConfig(selection.config, selection.name);

  const resolved = await resolveRun({
    cwd,
    config: picked.config,
    args: parsed._,
    env: input.env,
    allowAll,
    read: input.read,
    write: input.write,
    pkg: input.pkg,
  });
  if (picked.previewed !== true) {
    if (!selection) clearInteractiveScreen();
    const report = await PiSandboxReport.write({ cwd: root, sandbox: resolved.sandbox });
    console.info(
      PiSandboxFmt.table({ ...resolved.sandbox, report }, {
        gitRootExplicit,
      }),
    );
  }
  const output = await run(resolved);

  return {
    kind: 'run',
    input,
    parsed,
    output,
  };
};

/**
 * Helpers:
 */
const ProfileMenuNonTtyError = [
  'Cannot open the interactive profile menu because stdin/stdout is not a TTY.',
  'Pass --profile <name|path>, or use --non-interactive --profile <name|path>.',
  'Use --help for wrapper help; args after -- are passed to Pi after a profile is selected.',
].join(' ');

function resolveTty(input: t.PiCliProfiles.Input): t.PiCliProfiles.Tty {
  return input.tty ?? {
    stdin: Cli.Is.terminal('stdin'),
    stdout: Cli.Is.terminal('stdout'),
  };
}

function resolveProfileSelector(root: t.StringDir, value: string) {
  const ref = YamlConfig.Ref.resolve({
    value,
    dir: Fs.join(root, ProfilesFs.dir) as t.StringDir,
    ext: ProfilesFs.ext,
    label: '--profile',
    errorPrefix: 'Pi profiles',
    expandTilde: true,
  });

  if (ref.kind === 'path') {
    return {
      kind: 'path' as const,
      config: ref.path,
    };
  }

  return {
    kind: 'name' as const,
    name: ref.name,
    config: ref.path,
  };
}

async function prepareProfileConfig(path: t.StringPath, name: string) {
  if (name === 'default') {
    await ProfilesFs.ensureInitialYaml(path, name);
    return;
  }

  if (!(await Fs.exists(path))) {
    const part1 = `Profile config not found: ${Fs.trimCwd(path)}. `;
    const part2 = `Named profiles are not created implicitly`;
    const part3 = `create it from the profile menu first.`;
    throw new Error(`${part1} ${part2} ${part3}`);
  }
}
