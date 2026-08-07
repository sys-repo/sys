import { Cli, type t } from '../common.ts';
import { runtimeRoot } from '../../m.cli/u.runtime.ts';

import {
  DEFAULT_DEPENDENCIES,
  type Keyboard,
  type Started,
  type StartGuiDependencies,
} from './u.deps.ts';
import { appendCleanup, closeOnce, finalize, waitForTerminal } from './u.lifecycle.ts';
import { materialize } from './u.materialize.ts';
import { LIMITS, resolveIntegrity, resolveManifestSource } from './u.source.ts';
import { START_GUI_SOURCE } from '../u/u.start.gui.source.ts';

export type { StartGuiDependencies } from './u.deps.ts';
export { START_GUI_SOURCE } from '../u/u.start.gui.source.ts';

export type StartGuiInput = {
  cwd: t.PiCli.Cwd;
  until?: t.UntilInput;
  source?: t.PiCliProfiles.StartGuiSource;
  deps?: Partial<StartGuiDependencies>;
};

/** Lazy GUI start leaf. */
export async function start(input: StartGuiInput): Promise<void> {
  const root = runtimeRoot(input.cwd);
  const deps = Object.freeze({ ...DEFAULT_DEPENDENCIES, ...(input.deps ?? {}) });
  const sourceInput = input.source ?? START_GUI_SOURCE;
  const configured = Object.freeze({
    manifestUrl: sourceInput.manifestUrl,
    integrity: sourceInput.integrity,
  });
  const source = resolveManifestSource(configured.manifestUrl);
  const integrity = resolveIntegrity(configured.integrity);
  let started: Started | undefined;
  let keyboard: Keyboard | undefined;
  let failure: unknown;
  const close = closeOnce(() => started);

  try {
    const generation = await materialize({
      root,
      source,
      integrity,
      deps,
      until: input.until,
    });
    started = await deps.start({
      dir: generation.dir,
      integrity,
      limits: LIMITS,
      hostname: '127.0.0.1',
      port: 0,
      until: input.until,
    });
    keyboard = deps.bindKeyboard({
      exit: false,
      until: started.finished,
      onQuit: () => close('start:gui.keyboard.quit'),
    });
    deps.open(root, started.origin);

    if (keyboard) await waitForTerminal({ started, keyboard, close });
    else await started.finished;
  } catch (cause) {
    failure = cause;
  }

  const cleanup = await finalize({ keyboard, close });
  if (failure !== undefined) {
    throw cleanup === undefined || cleanup === failure ? failure : appendCleanup(failure, cleanup);
  }
  if (cleanup !== undefined) throw cleanup;
}
