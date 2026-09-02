import { run } from '../m.cli/m.run.ts';
import { PiSandboxFmt } from '../m.cli/u.fmt.sandbox.ts';
import { PiSandboxReport } from '../m.cli/u.report.sandbox.ts';

import { Cli, Obj, type t } from './common.ts';
import { ProfileArgs } from './u/u.args.ts';
import { ProfilesDslFmt } from './u/u.fmt.dsl.ts';
import { ProfilesFmt } from './u/u.fmt.help.ts';
import { menu, reopenProfileMenu } from './u/u.menu.ts';
import { ProfileConfig } from './u/u.profile.ts';
import { resolveRun } from './u/u.resolve.run.ts';
import { ProfileStartup } from './u/u.startup.ts';
import { type StartGuiCompletion, startGuiCompletionKind } from './u/u.start.gui.settlement.ts';
import { START_GUI_SERVICE, type StartGuiEvidence } from './u/u.start.gui.service.ts';

type MainDependencies = {
  readonly repaint: typeof Cli.Screen.repaint;
  readonly startGui: (input: {
    cwd: t.PiCli.Cwd;
    source: StartGuiEvidence;
    until?: AbortSignal;
  }) => Promise<StartGuiCompletion>;
};

const DEFAULT_DEPENDENCIES: MainDependencies = Object.freeze({
  repaint: Cli.Screen.repaint,
  async startGui(input) {
    const { start } = await import('./u.start/u.gui/mod.ts');
    return await start(input);
  },
});

export const main: t.PiCliProfiles.Lib['main'] = (input = {}) => mainWith(input);

/** Internal profile launcher with explicit GUI and repaint dependencies. */
export async function mainWith(
  input: t.PiCliProfiles.Input = {},
  deps: MainDependencies = DEFAULT_DEPENDENCIES,
): Promise<t.PiCliProfiles.Result> {
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

  let picked: t.PiCliProfiles.MenuResult = parsed.profile
    ? {
      kind: 'selected',
      mode: 'tui',
      config: (await ProfileConfig.resolveSelection(root, parsed.profile)).config,
    }
    : await menu({ cwd, allowAll, gitRootExplicit });

  if (picked.kind === 'exit') return { kind: 'exit', input };

  while (picked.mode === 'gui') {
    if (parsed._.length > 0) {
      throw new Error(
        'start:gui cannot accept Pi passthrough args. Select start:tui for passthrough mode.',
      );
    }

    if (parsed.installOcrDeps === true) {
      throw new Error(
        'start:gui does not support --install-ocr-deps. Use start:tui for OCR bootstrap.',
      );
    }

    const profilePath = picked.config;
    deps.repaint(
      picked.preview
        ? PiSandboxFmt.table(
          { ...picked.preview.sandbox, report: picked.preview.report },
          { gitRootExplicit },
        )
        : '',
    );
    picked = { kind: 'selected', mode: 'gui', config: profilePath };

    const completion = await deps.startGui({ cwd, source: START_GUI_SERVICE.source });
    const completionKind = startGuiCompletionKind(completion);
    if (completionKind === undefined) throw new Error('start:gui completion invalid.');
    if (completionKind !== 'back') {
      return {
        kind: 'gui',
        input,
        parsed,
      };
    }

    picked = await reopenProfileMenu({
      cwd,
      path: profilePath,
      allowAll,
      gitRootExplicit,
    });
    if (picked.kind === 'exit') return { kind: 'exit', input };
  }

  const resolved = await resolveRun(
    {
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
    },
  );
  const report = picked.preview && Obj.eql(picked.preview.sandbox, resolved.sandbox)
    ? picked.preview.report
    : await PiSandboxReport.write({
      cwd: root,
      sandbox: resolved.sandbox,
      gitRootExplicit,
    });
  const sheet = PiSandboxFmt.table({ ...resolved.sandbox, report }, {
    gitRootExplicit,
    tools: resolved.tools,
  });
  if (parsed.profile) console.info(sheet);
  else deps.repaint(sheet);

  const output = await run(resolved);
  return {
    kind: 'run',
    input,
    parsed,
    output,
  };
}
