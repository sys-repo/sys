import { type t, Color, D, Is } from './common.ts';

export type TreeHostResolvedParts = {
  readonly header: { readonly backgroundColor?: t.StringHex };
  readonly nav: { readonly backgroundColor?: t.StringHex };
  readonly main: { readonly backgroundColor?: t.StringHex };
  readonly footer: { readonly backgroundColor?: t.StringHex };
};

export function resolveParts(props: t.TreeHost.Props): TreeHostResolvedParts {
  const theme = Color.theme(props.theme).name;
  const header = { ...D.parts.header, ...props.parts?.header };
  const nav = { ...D.parts.nav, ...props.parts?.nav };
  const main = { ...D.parts.main, ...props.parts?.main };
  const footer = { ...D.parts.footer, ...props.parts?.footer };

  return {
    header: { backgroundColor: resolvePartBackground(header.background, theme) },
    nav: { backgroundColor: resolvePartBackground(nav.background, theme) },
    main: { backgroundColor: resolvePartBackground(main.background, theme) },
    footer: { backgroundColor: resolvePartBackground(footer.background, theme) },
  };
}

export function resolvePartBackground(
  input: t.TreeHost.PartBackground | undefined,
  theme: t.CommonTheme,
): t.StringHex | undefined {
  if (input === undefined || input === false) return undefined;
  if (input === true) return Color.theme(theme).bg;
  if (Is.func(input)) return input({ theme });
  return undefined;
}
