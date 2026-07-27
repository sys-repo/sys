import { Is, type t } from '../common.ts';
import { DevScreenLayout } from './u.dev.screen.layout.ts';
import { DevScreenRuntime } from './u.dev.screen.runtime.ts';

type ReporterMode = t.Vite.Dev.ReporterMode;

type ReporterResolveArgs = {
  silent?: boolean;
  hasPkg?: boolean;
  isInteractive?: () => boolean;
};

/** Stable parent-owned reporter facade for Vite dev output. */
export const DevScreen = {
  resolveReporter(input: unknown, options: ReporterResolveArgs): ReporterMode {
    const mode = wrangle.reporterMode(input);
    if (mode === 'raw') return 'raw';
    if (mode === 'screen') return options.silent || !options.hasPkg ? 'raw' : 'screen';
    if (options.silent || !options.hasPkg) return 'raw';
    return (options.isInteractive ?? wrangle.isInteractive)() ? 'screen' : 'raw';
  },

  logLines: (input?: unknown) => DevScreenLayout.logLines(input),

  create(args: t.ViteDev.Screen.Runtime.CreateArgs): t.ViteDev.Screen.Reporter {
    return DevScreenRuntime.create(args);
  },

  startupBody(args: t.ViteDev.Screen.Frame.StartupArgs) {
    return DevScreenLayout.startupBody(args);
  },

  startupToString(args: t.ViteDev.Screen.Frame.StartupArgs) {
    return DevScreenLayout.startupToString(args);
  },

  toString(args: t.ViteDev.Screen.Frame.ReadyArgs) {
    return DevScreenLayout.toString(args);
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  reporterMode(input: unknown): ReporterMode {
    if (input === undefined || input === 'auto') return 'auto';
    if (input === 'screen' || input === 'raw') return input;
    throw new Error(`Vite.dev: unsupported reporter mode: ${String(input)}`);
  },

  isInteractive() {
    try {
      return Deno.stdin.isTerminal() && Deno.stdout.isTerminal();
    } catch {
      return false;
    }
  },
} as const;
