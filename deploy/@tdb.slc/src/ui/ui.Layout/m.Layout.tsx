import { type t, Breakpoint } from './common.ts';

import { Layout as Base } from '../App.Layout/mod.ts';
import { LayoutDesktop } from './ui.Desktop.tsx';
import { LayoutIntermediate } from './ui.Intermediate.tsx';
import { LayoutMobile } from './ui.Mobile.tsx';

/**
 * Main Layout API (with UI components).
 */
export const Layout = {
  ...Base,

  /**
   * Render factory for the <Layout> component that matches the current size-breakpoint.
   */
  render(size: t.BreakpointSizeInput, state?: t.AppSignals) {
    const breakpoint = Breakpoint.from(size);
    const is = breakpoint.is;

    if (is.mobile) return <LayoutMobile state={state} />;
    if (is.intermediate) return <LayoutIntermediate state={state} />;
    if (is.desktop) return <LayoutDesktop state={state} />;

    return <div>{`Unsupported supported breakpoint: "${breakpoint.name}"`}</div>;
  },
} as const;
