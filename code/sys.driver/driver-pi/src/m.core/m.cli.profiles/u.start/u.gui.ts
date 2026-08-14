import type { Cli, t } from '../common.ts';
import { runtimeRoot } from '../../m.cli/u.runtime.ts';

import { VERIFIED_LOOPBACK_BROWSER_POLICY } from './u.browser.ts';
import {
  DEFAULT_DEPENDENCIES,
  type Keyboard,
  type Started,
  type StartGuiDependencies,
} from './u.deps.ts';
import { appendCleanup, closeOnce, finalize, waitForTerminal } from './u.lifecycle.ts';
import { materialize } from './u.materialize.ts';
import { LIMITS, resolveIntegrity, resolveManifestSource } from './u.source.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';

export type { StartGuiDependencies } from './u.deps.ts';

type KeyboardEvent = Parameters<NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']>>[0];

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
  const sourceInput = input.source ?? START_GUI_SERVICE.source;
  const configured = Object.freeze({
    manifestUrl: sourceInput.manifestUrl,
    integrity: sourceInput.integrity,
  });
  const source = resolveManifestSource(configured.manifestUrl);
  const integrity = resolveIntegrity(configured.integrity);
  let started: Started | undefined;
  let keyboard: Keyboard | undefined;
  let screen: ReturnType<StartGuiDependencies['createScreen']> | undefined;
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
      browserPolicy: VERIFIED_LOOPBACK_BROWSER_POLICY,
      silent: true,
      until: input.until,
    });
    keyboard = deps.bindKeyboard({
      exit: false,
      until: started.finished,
      onKey: (event) => {
        if (isBackKey(event)) return close('start:gui.keyboard.back');
      },
      onQuit: () => close('start:gui.keyboard.quit'),
    });
    screen = deps.createScreen({
      service: START_GUI_SERVICE.name,
      dir: generation.dir,
      origin: started.origin,
      keyboard: keyboard !== undefined,
    });
    const terminal = keyboard
      ? waitForTerminal({ started, keyboard, close, screenFailure: screen.failure })
      : Promise.race([started.finished, screen.failure]);
    // Observe terminal failure before browser launch so an open failure cannot orphan it.
    void terminal.catch(() => undefined);

    deps.open(root, started.origin);
    await terminal;
  } catch (cause) {
    failure = cause;
  }

  const cleanup = await finalize({ screen, keyboard, close });
  if (failure !== undefined) {
    throw cleanup === undefined || cleanup === failure ? failure : appendCleanup(failure, cleanup);
  }
  if (cleanup !== undefined) throw cleanup;
}

function isBackKey(event: KeyboardEvent): boolean {
  return event.key === 'left' && !event.altKey && !event.ctrlKey && !event.metaKey &&
    !event.shiftKey;
}
