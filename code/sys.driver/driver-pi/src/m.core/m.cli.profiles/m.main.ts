import { run } from '../m.cli/m.run.ts';
import { PiSandboxFmt } from '../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../m.cli/u.report.sandbox.ts';

import { type t } from './common.ts';
import { ProfileArgs } from './u/u.args.ts';
import { ProfilesFmt } from './u/u.fmt.help.ts';
import { menu } from './u/u.menu.ts';
import { ProfileConfig } from './u/u.profile.ts';
import { resolveRun } from './u/u.resolve.run.ts';
import { ProfileStartup } from './u/u.startup.ts';
import { clearInteractiveScreen } from './u/u.terminal.ts';

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

  const startup = await ProfileStartup.resolve({ input, parsed });
  if (startup.kind === 'exit') return { kind: 'exit', input };

  const { cwd, root, migrationMessage } = startup;
  const allowAll = input.allowAll === true || parsed.allowAll === true;
  const gitRootExplicit = parsed.gitRoot !== undefined;

  if (migrationMessage) console.info(migrationMessage);

  const selection = parsed.profile
    ? await ProfileConfig.resolveSelection(root, parsed.profile)
    : undefined;
  const picked = selection
    ? { kind: 'selected' as const, config: selection.config }
    : await menu({ cwd, allowAll, gitRootExplicit });

  if (picked.kind === 'exit') return { kind: 'exit', input };

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
    console.info(PiSandboxFmt.table({ ...resolved.sandbox, report }, { gitRootExplicit }));
  }
  const output = await run(resolved);

  return {
    kind: 'run',
    input,
    parsed,
    output,
  };
};

