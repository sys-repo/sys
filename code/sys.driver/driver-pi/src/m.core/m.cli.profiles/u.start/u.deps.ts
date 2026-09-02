import { BootstrapStatus, Cli, Dist, DistServer, Fs, Open, type t } from './common.ts';
import {
  StartGuiScreen,
  type StartGuiScreenInput,
  type StartGuiScreenInstance,
} from './u.screen/mod.ts';

/** Owner seams for focused GUI-start runtime tests. */
export type StartGuiDependencies = {
  readonly materialize: t.Dist.Materialize;
  readonly start: (args: t.DistServer.Start.Args) => Promise<Started>;
  readonly startStatus: typeof BootstrapStatus.start;
  readonly ensureDir: typeof Fs.ensureDir;
  readonly createRooted: typeof Fs.Capability.Rooted.create;
  /** Synchronous opener seam; unexpected runtime results are admitted by the caller. */
  readonly open: (...args: Parameters<t.OpenLib['invokeDetached']>) => unknown;
  readonly bindKeyboard: t.Cli.Keyboard.Lib['bind'];
  readonly createScreen: (input: StartGuiScreenInput) => StartGuiScreenInstance;
};

export const DEFAULT_DEPENDENCIES: StartGuiDependencies = Object.freeze({
  materialize: Dist.materialize,
  start: DistServer.start,
  startStatus: BootstrapStatus.start,
  ensureDir: Fs.ensureDir,
  createRooted: Fs.Capability.Rooted.create,
  open: Open.invokeDetached,
  bindKeyboard: Cli.Keyboard.bind,
  createScreen: StartGuiScreen.create,
});

export type Started = t.DistServer.Started;
export type FailedMaterialization = t.Dist.Failed;
