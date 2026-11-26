import { browserOrigin } from '../u/u.issuer.ts';
import { Anchor, Color, css, D, Is, KeyValue, type t } from './common.ts';

/** Renderer-authored documentation destinations, never inferred from supplied configuration values. */
const references = {
  origin: 'https://www.w3.org/TR/webauthn-3/#sctn-validating-origin',
  rpId: 'https://www.w3.org/TR/webauthn-3/#relying-party-identifier',
  rpName: 'https://www.w3.org/TR/webauthn-3/#dom-publickeycredentialentity-name',
  webAuthn: 'https://www.w3.org/TR/webauthn-3/#sctn-api',
} as const;

/**
 * Prerequisite observations with documentation on keys and full, selectable values.
 */
export const Context: t.FC<t.Passkey.ContextProps> = (props) => {
  const { debug = D.debug, context, title = 'Context' } = props;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, minWidth: 0, backgroundColor: Color.ruby(debug ? 0.1 : 0) }),
    value: css({ minWidth: 0, overflowWrap: 'anywhere', whiteSpace: 'normal' }),
  };
  const value = (text: string) => <div className={styles.value.class}>{text}</div>;
  const key = (label: string, href: string) => {
    return <Anchor.Link href={href} openIn='new-tab' theme={theme.name}>{label}</Anchor.Link>;
  };
  const valueOr = (text: string | undefined, fallback: string) =>
    value(!text || Is.blank(text) ? fallback : text);
  const rows: t.KeyValue.Item.Row[] = [
    {
      id: 'origin',
      k: key('Origin', references.origin),
      v: context.origin === browserOrigin
        ? (
          <div className={styles.value.class}>
            <Anchor.Link href={browserOrigin} openIn='new-tab' theme={theme.name}>
              {browserOrigin}
            </Anchor.Link>
          </div>
        )
        : valueOr(context.origin, 'Unknown'),
    },
    {
      id: 'rp-id',
      k: key('Relying Party ID', references.rpId),
      v: valueOr(context.rpId, 'Not configured'),
    },
    {
      id: 'rp-name',
      k: key('Relying Party Name', references.rpName),
      v: valueOr(context.rpName, 'Not configured'),
    },
    {
      id: 'web-authn',
      k: key('WebAuthn', references.webAuthn),
      v: value(availabilityText(context.webAuthn)),
    },
    { id: 'verifier', k: 'Account service', v: value(availabilityText(context.verifier)) },
  ];
  const items: t.KeyValue.Item[] = rows.map((row) => ({ ...row, userSelect: 'text' }));
  if (title !== null && !Is.blank(title)) {
    items.unshift({ id: 'context-title', kind: 'title', v: title });
  }

  return (
    <div data-passkey-section='context' className={css(styles.base, props.style).class}>
      <KeyValue.UI items={items} layout={D.layout} theme={theme.name} />
    </div>
  );
};

function availabilityText(value: t.Passkey.Context['verifier']): string {
  if (value.kind === 'configured') return 'Configured';
  if (value.kind === 'available') return 'Available';
  return `${value.kind === 'unknown' ? 'Unknown' : 'Unavailable'}: ${value.reason}`;
}
