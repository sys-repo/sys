import { run } from '../m.cli/m.run.ts';
import { PiSandboxFmt } from '../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../m.cli/u.report.sandbox.ts';
import { resolveCwd } from '../m.cli/u.resolve.cwd.ts';

import { Fs, type t } from './common.ts';
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

  if (parsed.config && parsed.profile) {
    throw new Error('--config and --profile are mutually exclusive; pass exactly one.');
  }

  if (parsed.nonInteractive && !parsed.config && !parsed.profile) {
    const err = 'Missing required flag: --profile or --config (required with --non-interactive).';
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

  const picked = parsed.config
    ? {
      kind: 'selected' as const,
      config: parsed.config as t.StringPath,
    }
    : parsed.profile
    ? {
      kind: 'selected' as const,
      config: profileConfigPath(root, parsed.profile),
    }
    : await menu({ cwd: root, allowAll });

  if (picked.kind === 'exit') return { kind: 'exit', input };

  if (parsed.profile) await prepareProfileConfig(picked.config, parsed.profile);

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
function runtimeRoot(cwd: t.PiCli.Cwd): t.StringDir {
  const root = cwd.root ?? cwd.git;
  if (!root) throw new Error('Pi profiles require a resolved runtime root.');
  return root;
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
