import { c, Cli, type t } from '../common.ts';
import type { BrowserTargets } from './u.browser.targets.ts';

/** Keep selection diagnostics for the session and handoff failures for the most recent press. */
export function readyCommands(browser: BrowserTargets, open: (href: t.StringUrl) => void) {
  const selection = browser.diagnostics.map(({ service, pathname, matches }) => {
    const why = matches === 0 ? 'no matching HTTP(S) URL' : `${matches} matching HTTP(S) URLs`;
    return `  ${service} ${pathname}: ${why}`;
  });
  let failures: string[] = [];

  return {
    canOpen: browser.targets.length > 0,
    warnings(maxRows: number) {
      const rows = failures.slice(0, maxRows);
      return rows.concat(selection.slice(0, maxRows - rows.length));
    },
    open() {
      failures = [];
      for (const { service, pathname, href } of browser.targets) {
        try {
          open(href);
        } catch {
          failures.push(`  ${service} ${pathname}: open request failed`);
        }
      }
    },
  };
}

/** Keep the divider and complete command row together, or omit the footer. */
export function readyFooter(width: number, maxRows: number, canOpen: boolean): string[] {
  if (maxRows < 2) return [];
  const { command, row } = Cli.Fmt.Keyboard;
  const right = command({ label: 'quit', keys: ['q'] });
  const hint = row({
    width,
    candidates: canOpen
      ? [
        { left: command({ label: 'open', keys: ['o'], context: 'browser' }), right },
        { left: command({ label: 'open', keys: ['o'] }), right },
      ]
      : [{ right }],
  });
  return hint ? [c.dim(Cli.Fmt.hr({ width, weight: 'dashed', color: 'gray' })), hint] : [];
}
