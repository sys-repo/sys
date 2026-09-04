import type { t } from '../common.ts';

import type { BootState, BootStateSource } from '../u.state.ts';
import type { StartGuiRecoveryPolicy } from '../../u/u.start.gui.service.ts';

export type StartGuiScreenInput = {
  readonly service: string;
  readonly url: t.StringUrl;
  /** Exact development generation hosted by this session; omitted for release acquisition. */
  readonly root?: t.StringAbsoluteDir;
  /** Exact admitted release-manifest location associated with the verified Dist digest. */
  readonly manifestUrl?: t.StringUrl;
  /** Package-owned policy available only for the canonical local evidence source. */
  readonly recovery?: StartGuiRecoveryPolicy;
  readonly state: BootStateSource;
  readonly keyboard: boolean;
  /** Synchronously publishes a screen failure at its package-controlled source. */
  readonly onFailure: (cause: unknown) => void;
};

export type StartGuiScreenInstance = {
  /** Exact result of the synchronous presentation acquisition transaction. */
  readonly kind: 'acquired' | 'failed' | 'unavailable';
  /** Rejects for acquisition or later repaint failure without losing cleanup authority. */
  readonly failure: Promise<never>;
  /** Remeasure and repaint the current authoritative screen state. */
  readonly redraw: () => void;
  readonly warnOpen: () => void;
  /** Retryable release; completed subresources are never disposed twice. */
  readonly dispose: () => void;
};

export type StartGuiScreenDependencies = {
  readonly isInteractive: () => boolean;
  readonly size: () => unknown;
  readonly observeResize: (handler: (size: unknown) => void) => () => void;
  readonly repaint: (frame: string) => void;
};

export type ScreenSize = t.Cli.Screen.Size;

export type CapturedRootLink = Readonly<{
  readonly text: t.StringAbsoluteDir;
  readonly url: URL;
}>;

export type RootLinkInput = t.StringAbsoluteDir | CapturedRootLink;

export type StartGuiScreenRenderInput = {
  readonly service: string;
  readonly url: t.StringUrl;
  readonly root?: RootLinkInput;
  readonly manifestUrl?: t.StringUrl;
  readonly recovery?: StartGuiRecoveryPolicy;
  readonly state: BootState;
  readonly keyboard: boolean;
  readonly openWarning: boolean;
  readonly viewport: ScreenSize;
};
