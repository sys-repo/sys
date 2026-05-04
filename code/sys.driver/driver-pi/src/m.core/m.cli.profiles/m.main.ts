import { run } from '../m.cli/m.run.ts';
import { PiSandboxFmt } from '../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../m.cli/u.report.sandbox.ts';
import { resolveCwd } from '../m.cli/u.resolve.cwd.ts';
import { runtimeRoot } from '../m.cli/u.runtime-root.ts';

import { Fs, Path, type t } from './common.ts';
import { ProfileArgs } from './u.args.ts';
import { ProfilesFmt } from './u.fmt.help.ts';
import { ProfilesFs } from './u.fs.ts';
import { menu } from './u.menu.ts';
import { ProfileMigrate } from './u.migrate/mod.ts';
import { resolveRun } from './u.resolve.run.ts';

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

  const resolvedCwd = await resolveCwd(input.cwd, {
    gitRoot: parsed.gitRoot,
    interactive: parsed.nonInteractive !== true,
  });
  if (resolvedCwd.kind === 'exit') return { kind: 'exit', input };
  const cwd = resolvedCwd.cwd;
  const root = runtimeRoot(cwd);
  const allowAll = input.allowAll === true || parsed.allowAll === true;

  const migration = await ProfileMigrate.dir(root);
  const migrationMessage = ProfileMigrate.message(migration);
  if (migrationMessage) console.info(migrationMessage);

  const selection = parsed.profile ? resolveProfileSelector(root, parsed.profile) : undefined;
  const picked = selection
    ? {
      kind: 'selected' as const,
      config: selection.config,
    }
    : await menu({ cwd: root, allowAll });

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
    const report = await PiSandboxReport.write({ cwd: root, sandbox: resolved.sandbox });
    console.info(PiSandboxFmt.table({ ...resolved.sandbox, report }));
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
function resolveProfileSelector(root: t.StringDir, value: string) {
  if (isExplicitProfilePath(value)) {
    return {
      kind: 'path' as const,
      config: resolveExplicitProfilePath(value),
    };
  }

  return {
    kind: 'name' as const,
    name: value,
    config: profileConfigPath(root, value),
  };
}

function isExplicitProfilePath(value: string) {
  return (
    Path.Is.absolute(value as t.StringPath) ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('~/')
  );
}

function resolveExplicitProfilePath(value: string) {
  if (value.startsWith('~/')) {
    const home = Deno.env.get('HOME');
    if (!home) throw new Error('Cannot resolve ~/ profile path because HOME is not set.');
    return Fs.join(home, value.slice(2)) as t.StringPath;
  }
  return value as t.StringPath;
}

function profileConfigPath(cwd: t.StringDir, name: string) {
  return Fs.join(cwd, ProfilesFs.fileOf(name)) as t.StringPath;
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
