import { BootstrapStatus, Cli, Dist, DistServer, Open, type t } from './common.ts';
import {
  StartGuiScreen,
  type StartGuiScreenInput,
  type StartGuiScreenInstance,
} from './u.screen/mod.ts';

/** Owner seams for focused GUI-start runtime tests. */
export type StartGuiDependencies = {
  readonly openGeneration: t.Dist.Generation.Open.Method;
  readonly start: (args: t.DistServer.Start.Args) => Promise<t.DistServer.Started>;
  readonly startStatus: typeof BootstrapStatus.start;
  /** Synchronous opener seam; unexpected runtime results are admitted by the caller. */
  readonly open: (...args: Parameters<t.OpenLib['invokeDetached']>) => unknown;
  readonly bindKeyboard: t.Cli.Keyboard.Lib['bind'];
  readonly createScreen: (input: StartGuiScreenInput) => StartGuiScreenInstance;
};

export const DEFAULT_DEPENDENCIES: StartGuiDependencies = Object.freeze({
  openGeneration: Dist.Generation.open,
  start: DistServer.start,
  startStatus: BootstrapStatus.start,
  open: Open.invokeDetached,
  bindKeyboard: Cli.Keyboard.bind,
  createScreen: StartGuiScreen.create,
});
