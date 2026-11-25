import { c, Cli, type t } from '../common.ts';
import type { BrowserTargets } from './u.browser.targets.ts';

// Match the documented Cli.Fmt.Text output ceiling when planning a footer row.
const MAX_FOOTER_ROW_CODE_UNITS = 65_535;

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

/** Admit both footer rows before reserving space or composing them at full width. */
export function readyFooter(width: number, canOpen: boolean) {
  const divider = (width: number) => c.dim(Cli.Fmt.hr({ width, weight: 'dashed', color: 'gray' }));
  if (divider(1).length + width - 1 > MAX_FOOTER_ROW_CODE_UNITS) return;

  const { command, row } = Cli.Fmt.Keyboard;
  const right = command({ label: 'quit', keys: ['q'] });
  const open = (context?: string) =>
    command({ label: 'open', keys: ['o'], keyColor: 'cyan', context });
  const candidates = canOpen ? [{ left: open('browser'), right }, { left: open(), right }] : [
    { right },
  ];
  // All fixed hints fit by 80 columns. Beyond that, only the ASCII space padding grows.
  const probeWidth = Math.min(width, 80);
  const padding = width - probeWidth;
  for (const candidate of candidates) {
    const probe = row({ width: probeWidth, candidates: [candidate] });
    if (!probe || probe.length + padding > MAX_FOOTER_ROW_CODE_UNITS) continue;
    return {
      rowCount: 2,
      render(): string[] {
        const hint = padding ? row({ width, candidates: [candidate] }) : probe;
        return hint ? [divider(width), hint] : [];
      },
    };
  }
}
