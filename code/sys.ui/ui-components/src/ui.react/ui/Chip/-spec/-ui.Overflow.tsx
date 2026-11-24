import { Anchor } from '../../Anchor/mod.ts';
import { BulletList } from '../../BulletList/mod.ts';
import { Button } from '../../Button/mod.ts';
import { Chip } from '../mod.ts';
import { Color, css, type t } from './common.ts';

type Props = Pick<t.Chip.Props, 'debug' | 'theme' | 'mono' | 'size' | 'truncate'> & {
  fontSize: number;
  width: number;
};
const sampleToken = '/-sample/not-a-real-path/long-directory-name/example.bundle.js.map';

/**
 * Browser fixtures for token bounds, baseline alignment and explicit clipping ownership.
 * Static label boxes only: no Text.Label or Markdown behavior is implemented here.
 */
export function Overflow(props: Props) {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 16,
      minWidth: 0,
      width: props.width,
      maxWidth: '100%',
      fontSize: props.fontSize,
      color: theme.fg,
    }),
    heading: css({ fontSize: 11, fontFamily: 'sans-serif', opacity: 0.65, marginBottom: 5 }),
    line: css({ outline: `dotted 1px ${Color.alpha(theme.fg, 0.25)}` }),
    prefix: css({ display: 'inline-block', width: 'calc(100% - 2em)' }),
    code: css({ font: 'inherit' }),
    outerOwnedChip: css({ display: 'inline' }),
    label: css({
      display: 'inline-block',
      maxWidth: '100%',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    }),
  };
  const chipProps = { size: props.size, mono: props.mono, debug: props.debug };
  const truncate = props.truncate;
  const code = (text: string) => <code className={styles.code.class}>{text}</code>;
  const mixed = (
    <span>
      Run <Chip.UI {...chipProps} truncate={truncate}>{code(sampleToken)}</Chip.UI> now.
    </span>
  );
  const rows: readonly { title: string; content: t.ReactNode }[] = [
    {
      title: '1 · Current-line fit',
      content: (
        <>
          Run <Chip.UI {...chipProps} truncate={truncate}>build</Chip.UI> now.
        </>
      ),
    },
    {
      title: '2 · Fresh-line fit (only 2em remain on the first line)',
      content: (
        <>
          <span className={styles.prefix.class}>Before</span>
          <Chip.UI {...chipProps} truncate={truncate}>{code('build --prod')}</Chip.UI> after.
        </>
      ),
    },
    {
      title: '3 · Long sample token → ellipsis only beyond full-line width',
      content: <Chip.UI {...chipProps} truncate={truncate}>{code(sampleToken)}</Chip.UI>,
    },
    {
      title: '4 · Baseline: plain / unclipped Chip / bounded Chip / plain',
      content: (
        <>
          Ag <Chip.UI {...chipProps} truncate={false}>Ag</Chip.UI>{' '}
          <Chip.UI {...chipProps} truncate>Ag</Chip.UI> Ag
        </>
      ),
    },
    {
      title: '5 · Adjacent tokens, nested strong/emphasis',
      content: (
        <>
          Run{' '}
          <strong>
            <em>
              <Chip.UI {...chipProps} truncate={truncate}>{code('build')}</Chip.UI>
            </em>
          </strong>{' '}
          <Chip.UI {...chipProps} truncate={truncate}>{code(sampleToken)}</Chip.UI> now.
        </>
      ),
    },
    {
      title: '6 · Whole-label owner (inline Chip, clipping off)',
      content: (
        <span className={styles.label.class}>
          Run{' '}
          <Chip.UI {...chipProps} truncate={false} style={styles.outerOwnedChip}>
            {code(sampleToken)}
          </Chip.UI>{' '}
          now.
        </span>
      ),
    },
    {
      title: '7 · Whole-label owner, code only (inline Chip, clipping off)',
      content: (
        <span className={styles.label.class}>
          <Chip.UI {...chipProps} truncate={false} style={styles.outerOwnedChip}>
            {code(sampleToken)}
          </Chip.UI>
        </span>
      ),
    },
    {
      title: '8 · Anchor owner, code only (inline Chip, clipping off)',
      content: (
        <Anchor.Link
          href='#chip-overflow'
          resource='web'
          theme={theme.name}
          truncate
          style={{ maxWidth: '100%' }}
          onClick={(e) => e.preventDefault()}
        >
          <Chip.UI {...chipProps} truncate={false} style={styles.outerOwnedChip}>
            {code(sampleToken)}
          </Chip.UI>
        </Anchor.Link>
      ),
    },
    {
      title: '9 · Button label slot, 120px',
      content: <Button theme={theme.name} style={{ width: 120 }} label={mixed} />,
    },
    {
      title: '10 · Button children slot, 120px',
      content: <Button theme={theme.name} style={{ width: 120 }}>{mixed}</Button>,
    },
    {
      title: '11 · Two-column BulletList, explicit rich nodes',
      content: (
        <BulletList.UI
          theme={theme.name}
          columns={2}
          items={[
            { id: 'build', label: mixed },
            {
              id: 'inspect',
              label: (
                <>
                  Inspect <Chip.UI {...chipProps} truncate>code</Chip.UI>
                </>
              ),
            },
            { id: 'disabled', label: mixed, enabled: false },
          ]}
        />
      ),
    },
  ];

  return (
    <div className={styles.base.class}>
      <div className={styles.heading.class}>Synthetic sample paths — not repository locations.</div>
      {rows.map(({ title, content }) => {
        return (
          <section key={title}>
            <div className={styles.heading.class}>{title}</div>
            <div className={styles.line.class}>{content}</div>
          </section>
        );
      })}
    </div>
  );
}
