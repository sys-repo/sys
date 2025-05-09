import { type t, Breakpoint } from './common.ts';

import { Layout as Base } from '../App.Layout/mod.ts';
import { LayoutDesktop as Desktop } from './ui.Desktop.tsx';
import { LayoutIntermediate as Intermediate } from './ui.Intermediate.tsx';
import { LayoutMobile as Mobile } from './ui.Mobile.tsx';

/**
 * Main Layout API (with UI components).
 */
export const Layout = {
  ...Base,

  /**
   * Render factory for the <Layout> component that matches the current size-breakpoint.
   */
  render(size: t.BreakpointSizeInput, state?: t.AppSignals) {
    const theme: t.CommonTheme = 'Dark';
    const breakpoint = Breakpoint.from(size);
    const is = breakpoint.is;

    if (is.mobile) return <Mobile state={state} theme={theme} />;
    if (is.intermediate) return <Intermediate state={state} theme={theme} />;
    if (is.desktop) return <Desktop state={state} theme={theme} />;

    return <div>{`Unsupported supported breakpoint: "${breakpoint.name}"`}</div>;
  },

  View: {
    Mobile,
    Intermediate,
    Desktop,
  },
} as const;
