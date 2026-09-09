import type { t } from '../common.server.ts';

export type * from '../../common/t.ts';

type PresentationArgs = {
  origin: t.StringUrl;
  dir: t.StringDir;
  /** Local manifest recording the displayed Dist digest. */
  manifestHref?: URL;
  authority: t.DistServer.Started['authority'];
  evidence: t.FsPkg.Dist.Verify.Evidence;
  renderedAt: t.UnixTimestamp;
};

/**
 * Internal contracts for the terminal-owned Dist serve screen.
 */
export declare namespace DistServeScreen {
  /** Navigation controls rendered by the screen. */
  export type Navigation = 'nested';

  /** Keyboard controls rendered by the screen. */
  export type Keyboard = {
    enabled: boolean;
    print: boolean;
    navigation?: Navigation;
  };

  /** Complete input for one pure frame projection. */
  export type FrameArgs = PresentationArgs & {
    identity: t.Cli.Fmt.Header.PackageIdentity | undefined;
    viewport: t.Cli.Screen.Size;
    cursorRows: number;
    keyboard: Keyboard;
  };

  /** Inputs retained by one responsive screen runtime. */
  export type CreateArgs = PresentationArgs & {
    identity?: t.Cli.Fmt.Header.PackageIdentity;
    keyboard?: Keyboard;
    until?: t.UntilInput;
    terminal?: Partial<Terminal>;
    schedule?: Schedule;
  };

  /** Responsive screen lifecycle returned after successful acquisition. */
  export type Reporter = {
    readonly failure: Promise<never>;
    /** Synchronously remeasure the terminal and repaint from retained startup inputs. */
    readonly redraw: () => void;
    readonly dispose: () => void;
  };

  /** Terminal authority used by the responsive screen runtime. */
  export type Terminal = {
    readonly cursorRows: number;
    size(): t.Cli.Screen.Size;
    events(until?: t.UntilInput): t.Cli.Screen.Events;
    repaint(frame: string): void;
  };

  /** Deferred repaint scheduler. */
  export type Schedule = (run: () => void) => t.Cancellable;
}
