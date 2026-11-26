import { SpecLinks } from './-u.navigation.ts';
import { Anchor, Color, css, Dev, type t } from './common.ts';

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
  const styles = {
    body: css({ fontSize: 12 }),
    link: css({ color: theme.fg }),
  };
  return (
    <div className={styles.body.class}>
      <Anchor.Link
        href='https://www.w3.org/TR/webauthn-3/'
        resource='web'
        openIn='new-tab'
        title='Web Authentication Level 3 — W3C specification (opens in a new tab)'
        theme={theme.name}
        style={styles.link}
      >
        WebAuthn · W3C
      </Anchor.Link>
    </div>
  );
};
