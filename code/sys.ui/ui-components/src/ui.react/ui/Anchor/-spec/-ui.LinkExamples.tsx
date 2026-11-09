import { Fragment } from 'react';
import { Color, css, Dev, type t } from './common.ts';
import { Anchor } from '../mod.ts';
import { exampleStyles } from './-u.exampleStyles.ts';

type Props = Pick<t.Anchor.Props, 'theme' | 'enabled'>;
type Kind = 'plain' | 'arrow-only' | 'resource-plus-arrow';

/** Bounded visual/keyboard/AT specimens, not a claim of browser or accessibility proof. */
export const LinkExamples: t.FC<Props> = (props) => {
  const theme = Color.theme(props.theme);
  const native = { theme: theme.name, enabled: props.enabled, href: 'https://example.com' };
  const label = (
    <>
      <strong>Example</strong> website
    </>
  );
  const longLabel = <>{label} with a longer descriptive label</>;
  const styles = {
    ...exampleStyles(),
    base: css({ width: 480, color: theme.fg, display: 'grid', fontSize: 14 }),
    prose: css({ margin: 0 }),
  };

  function link(kind: Kind) {
    if (kind === 'plain') return <Anchor.UI {...native}>{label}</Anchor.UI>;
    return (
      <Anchor.Link
        {...native}
        resource={kind === 'resource-plus-arrow' ? 'web' : undefined}
        openIn={kind === 'resource-plus-arrow' ? 'new-tab' : 'self'}
      >
        {label}
      </Anchor.Link>
    );
  }

  return (
    <div className={styles.base.class}>
      {(['plain', 'arrow-only', 'resource-plus-arrow'] as const).map((kind, index) => (
        <Fragment key={kind}>
          {index > 0 && <Dev.Divider theme={theme.name} />}
          <section
            aria-label={`${kind} / standalone`}
            className={styles.example.class}
          >
            <div className={styles.label.class}>{`${kind} / standalone`}</div>
            <div>{link(kind)}</div>
          </section>

          <Dev.Divider theme={theme.name} />

          <section aria-label={`${kind} / prose`} className={styles.example.class}>
            <div className={styles.label.class}>{`${kind} / prose`}</div>
            <p className={styles.prose.class}>See the {link(kind)} for more information.</p>
          </section>
        </Fragment>
      ))}

      <Dev.Divider theme={theme.name} />

      <section aria-label='Wrapping' className={styles.example.class}>
        <div className={styles.label.class}>Rich label / constrained wrapping</div>
        <p className={css(styles.prose, { maxWidth: 240 }).class}>
          See the <Anchor.Link {...native} resource='web'>{longLabel}</Anchor.Link>{' '}
          for more information.
        </p>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='RTL and host size' className={styles.example.class}>
        <div className={styles.label.class}>
          RTL container / 12px host / logical marker positions
        </div>
        <p dir='rtl' className={css(styles.prose, { fontSize: 12, maxWidth: 180 }).class}>
          See the <Anchor.Link {...native} resource='web'>{label}</Anchor.Link>{' '}
          for more information.
        </p>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='Opening help' className={styles.example.class}>
        <div className={styles.label.class}>
          New-context description / localized / explicit title clear
        </div>
        <div>
          <Anchor.Link
            {...native}
            openIn='new-tab'
            openHint='Ouvre un nouvel onglet ou une fenêtre'
          >
            Localized opening help
          </Anchor.Link>
          {' · '}
          <Anchor.Link {...native} openIn='new-tab' title=''>
            No hover title; description retained
          </Anchor.Link>
        </div>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='Unavailable references' className={styles.example.class}>
        <div className={styles.label.class}>Disabled resource / missing destination</div>
        <div>
          <Anchor.Link {...native} resource='web' openIn='new-tab' enabled={false}>
            Unavailable
          </Anchor.Link>
          {' · '}
          <Anchor.Link resource='web' openIn='new-tab'>
            <em>Missing destination</em>
          </Anchor.Link>
        </div>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='Caller focus' className={styles.example.class}>
        <div className={styles.label.class}>Caller focus clear</div>
        <div>
          <Anchor.Link {...native} style={{ ':focus-visible': undefined }}>
            Caller owns focus
          </Anchor.Link>
        </div>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='Clipping' className={styles.example.class}>
        <div className={styles.label.class}>Clipping test / intentionally cut off at 180px</div>
        <div className={css({ width: 180, overflow: 'hidden', whiteSpace: 'nowrap' }).class}>
          <Anchor.Link {...native} resource='web'>{longLabel}</Anchor.Link>
        </div>
      </section>
    </div>
  );
};
