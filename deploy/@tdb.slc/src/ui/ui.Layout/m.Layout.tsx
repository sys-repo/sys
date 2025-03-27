import { type t } from './common.ts';
import { Breakpoint } from './m.Breakpoint.ts';

import { LayoutDesktop } from './ui.Desktop.tsx';
import { LayoutIntermediate } from './ui.Intermediate.tsx';
import { LayoutMobile } from './ui.Mobile.tsx';

/**
 * Main Layout API.
 */
export const Layout = {
  Breakpoint,

  /**
   * Render factory for the <Layout> component that matches the current size-breakpoint.
   */
  render(size: t.BreakpointSizeInput, signals?: t.AppSignals) {
    const breakpoint = Breakpoint.from(size);
    const is = breakpoint.is;

    if (is.mobile) return <LayoutMobile signals={signals} />;
    if (is.intermediate) return <LayoutIntermediate signals={signals} />;
    if (is.desktop) return <LayoutDesktop signals={signals} />;

    return <div>{`Unsupported supported breakpoint: "${breakpoint.name}"`}</div>;
  },
} as const;
