import { run } from '../m.cli/m.run.ts';
import { PiSandboxFmt } from '../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../m.cli/u.report.sandbox.ts';

import { Cli, Obj, type t } from './common.ts';
import { ProfileArgs } from './u/u.args.ts';
import { ProfilesDslFmt } from './u/u.fmt.dsl.ts';
import { ProfilesFmt } from './u/u.fmt.help.ts';
import { menu } from './u/u.menu.ts';
import { ProfileConfig } from './u/u.profile.ts';
import { resolveRun } from './u/u.resolve.run.ts';
import { ProfileStartup } from './u/u.startup.ts';

export const main: t.PiCliProfiles.Lib['main'] = async (input = {}) => {
  const argv = input.argv ?? [];

  if (argv[0] === 'dsl') {
    const text = await ProfilesDslFmt.output(argv.slice(1));
    console.info(text);
    return { kind: 'help', input, text };
  }

  const parsed = ProfileArgs.parse(argv);

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

  const { cwd, root, migrationMessage, interactive } = startup;
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
    ocr: {
      installDeps: parsed.installOcrDeps === true,
      interactive,
    },
  });
  const report = picked.preview && Obj.eql(picked.preview.sandbox, resolved.sandbox)
    ? picked.preview.report
    : await PiSandboxReport.write({
      cwd: root,
      sandbox: resolved.sandbox,
      gitRootExplicit,
    });
  const sheet = PiSandboxFmt.table({ ...resolved.sandbox, report }, { gitRootExplicit });
  if (selection) console.info(sheet);
  else Cli.Screen.repaint(sheet);

  const output = await run(resolved);

  return {
    kind: 'run',
    input,
    parsed,
    output,
  };
};
