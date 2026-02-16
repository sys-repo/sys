import { type t, Color, D, Is } from './common.ts';

export type TreeHostResolvedParts = {
  readonly nav: { readonly backgroundColor?: t.StringHex };
  readonly main: { readonly backgroundColor?: t.StringHex };
};

export function resolveParts(props: t.TreeHostProps): TreeHostResolvedParts {
  const theme = Color.theme(props.theme).name;
  const nav = { ...D.parts.nav, ...props.parts?.nav };
  const main = { ...D.parts.main, ...props.parts?.main };

  return {
    nav: { backgroundColor: resolvePartBackground(nav.background, theme) },
    main: { backgroundColor: resolvePartBackground(main.background, theme) },
  };
}

export function resolvePartBackground(
  input: t.TreeHostPartBackground | undefined,
  theme: t.CommonTheme,
): t.StringHex | undefined {
  if (input === undefined || input === false) return undefined;
  if (input === true) return Color.theme(theme).bg;
  if (Is.func(input)) return input({ theme });
  return undefined;
}
