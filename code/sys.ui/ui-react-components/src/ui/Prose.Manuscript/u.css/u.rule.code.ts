import { type t, Color } from './common.ts';

export function code(args: { rule: t.Prose.ScopedCssRule; theme: t.ColorTheme }) {
  const { rule, theme } = args;
  rule('code', {
    backgroundColor: Color.alpha(theme.fg, 0.03),
    color: Color.alpha(theme.fg, 0.8),
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: '0.85em',
    lineHeight: 1,
    Padding: [2, 4],
    borderRadius: 4,
    border: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
  });
}
