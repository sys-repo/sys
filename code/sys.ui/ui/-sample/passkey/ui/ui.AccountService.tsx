import { LuMemoryStick } from 'react-icons/lu';
import { Bullet, Color, css, D, Is, KeyValue, type t } from './common.ts';
import { EmptyValue } from './ui.EmptyValue.tsx';

const storageLabel = 'Service: In memory storage';
const colors = {
  unknown: undefined,
  available: Color.GREEN,
  unavailable: Color.YELLOW,
} satisfies Record<t.AccountRuntime.ServiceAvailability, t.StringHex | undefined>;

/** Display the host's latest service observation without initiating a read. */
export function AccountService(
  props: t.Passkey.ServiceProps & Pick<t.Passkey.Appearance, 'theme'>,
) {
  const { observation, availability = 'unknown', theme, title = 'Account Service' } = props;
  const counts = observation.kind === 'observed' ? observation.counts : undefined;
  const rows: t.KeyValue.Item.Row[] = [
    { id: 'accounts', k: 'Total accounts', v: counts?.accounts ?? <EmptyValue /> },
    { id: 'passkeys', k: 'Total passkeys', v: counts?.registeredPasskeys ?? <EmptyValue /> },
    { id: 'valid-sessions', k: 'Valid sessions', v: counts?.validSessions ?? <EmptyValue /> },
  ];
  const items: t.KeyValue.Item[] = rows.map((row) => ({ ...row, userSelect: 'text' }));
  let header: t.ReactNode;
  if (title !== null && !Is.blank(title)) {
    const color = colors[availability];
    const label = `Accounts API: ${availability}`;
    const heading = (
      <div className={css({ display: 'inline-flex', alignItems: 'center', gap: 8 }).class}>
        {title}
        <div role='img' aria-label={label} title={label}>
          <Bullet
            selected={color !== undefined}
            selectedColor={color}
            borderOpacity={color === undefined ? 0.6 : undefined}
            theme={theme}
          />
        </div>
      </div>
    );
    const size = 17;
    const frame = css({
      position: 'relative',
      paddingRight: size + 8,
      marginBottom: D.layout.rowGap,
    });
    const icon = css({
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      color: Color.theme(theme).fg,
    });
    header = (
      <div className={frame.class}>
        <KeyValue.UI items={[{ kind: 'title', v: heading }]} layout={D.layout} theme={theme} />
        <LuMemoryStick
          size={size}
          className={icon.class}
          role='img'
          aria-label={storageLabel}
          title={storageLabel}
        />
      </div>
    );
  }

  return (
    <div data-passkey-service=''>
      {header}
      <KeyValue.UI items={items} layout={D.layout} theme={theme} />
    </div>
  );
}
