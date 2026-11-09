import { Dev } from '@sys/ui-components/react/dev';
import { Anchor, Color, css, type t } from './common.ts';
import { SpecLinks } from './-u.navigation.ts';

type SpecLinkProps = { to: keyof typeof SpecLinks };
type WebAuthnLinkProps = { theme?: t.CommonTheme };

/** Reciprocal specimen navigation on the debug panel's light surface. */
export const SpecLink: t.FC<SpecLinkProps> = (props) => {
  const link = SpecLinks[props.to];
  const theme = Color.theme();
  return (
    <Dev.Link href={link.href} openIn='self' theme={theme.name}>
      {link.label}
    </Dev.Link>
  );
};

/** A standards reference in host chrome, never part of the specimen itself. */
export const WebAuthnLink: t.FC<WebAuthnLinkProps> = (props) => {
  const theme = Color.theme(props.theme);
  const style = css({ color: theme.fg, fontSize: 12 });
  return (
    <Anchor.Link
      href='https://www.w3.org/TR/webauthn-3/'
      resource='web'
      openIn='new-tab'
      title='Web Authentication Level 3 — W3C specification (opens in a new tab)'
      theme={theme.name}
      style={style}
    >
      WebAuthn · W3C
    </Anchor.Link>
  );
};
