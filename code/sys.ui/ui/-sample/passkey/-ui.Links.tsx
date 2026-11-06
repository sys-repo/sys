import { Anchor, Color, css, type t } from './common.ts';
import { SpecLinks } from './-u.navigation.ts';

type SpecLinkProps = { to: keyof typeof SpecLinks };
type WebAuthnLinkProps = { theme?: t.CommonTheme };

/** Reciprocal specimen navigation on the debug panel's light surface. */
export const SpecLink: t.FC<SpecLinkProps> = (props) => {
  const link = SpecLinks[props.to];
  const theme = Color.theme();
  return (
    <Anchor.UI href={link.href} theme={theme.name}>
      {link.label} <span aria-hidden='true'>→</span>
    </Anchor.UI>
  );
};

/** A standards reference in host chrome, never part of the specimen itself. */
export const WebAuthnLink: t.FC<WebAuthnLinkProps> = (props) => {
  const theme = Color.theme(props.theme);
  const style = css({ color: theme.fg, fontSize: 12 });
  return (
    <Anchor.UI
      href='https://www.w3.org/TR/webauthn-3/'
      target='_blank'
      title='Web Authentication Level 3 — W3C Recommendation (opens in a new tab)'
      theme={theme.name}
      style={style}
    >
      WebAuthn · W3C <span aria-hidden='true'>↗</span>
    </Anchor.UI>
  );
};
