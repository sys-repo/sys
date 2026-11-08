import { Button } from '../../Button/mod.ts';
import { KeyValue } from '../../KeyValue/mod.ts';
import { Color, css, Style, type t } from './common.ts';
import { A } from '../mod.ts';

type Props = Pick<t.Anchor.Props, 'theme' | 'enabled'>;

/** Browser specimens: inline fragments, clipping, overrides, and native link activation. */
export function FocusExamples(props: Props) {
  const theme = Color.theme(props.theme);
  const link = { theme: theme.name, enabled: props.enabled, href: '#anchor-focus-target' };
  const styles = {
    base: css({ display: 'grid', width: 360, color: theme.fg, lineHeight: 1.6 }),
    label: css({ fontSize: 12, opacity: 0.65, marginTop: 2 }),
    divider: css({
      Margin: [14, -10, 0, -10],
      height: 1,
      backgroundColor: Color.alpha(theme.fg, 0.1),
      pointerEvents: 'none',
    }),
    paragraph: css({ margin: 0, width: 220 }),
    clipped: css({ width: 220, overflow: 'hidden', whiteSpace: 'nowrap' }),
  };
  Style.Dom.stylesheet().rule('from', { textShadow: '0 0 6px currentColor' }, {
    context: '@keyframes sys-anchor-spec-hover',
  });

  return (
    <div className={styles.base.class}>
      <div className={css(styles.label, { marginBottom: 14 }).class}>
        Tab / Shift+Tab. Check settled focus, zoom, reduced motion and forced colours.
      </div>
      <section>
        <div className={styles.label.class}>shared outline · Button / Anchor</div>
        <Button theme={theme.name} enabled={props.enabled}>Button</Button>
        {' · '}
        <A {...link}>Anchor</A>
      </section>

      <div aria-hidden='true' className={styles.divider.class} />

      <section>
        <div className={styles.label.class}>inline · multiline</div>
        <p className={styles.paragraph.class}>
          Before <A {...link}>a longer link that wraps naturally across several lines</A> after.
        </p>
      </section>

      <div aria-hidden='true' className={styles.divider.class} />

      <section>
        <div className={styles.label.class}>clipped host · no layout compensation</div>
        <div className={styles.clipped.class}>
          <A {...link}>A long link inside an overflow-hidden host</A>
        </div>
      </section>

      <div aria-hidden='true' className={styles.divider.class} />

      <section>
        <div className={styles.label.class}>KeyValue · truncated cell</div>
        <KeyValue.UI
          theme={theme.name}
          enabled={props.enabled}
          truncate
          layout={{ kind: 'table' }}
          style={{ width: 220 }}
          items={[{
            k: 'Link',
            v: 'A longer label truncated inside the actual KeyValue cell',
            href: { href: link.href, open: 'inline' },
          }]}
        />
      </section>

      <div aria-hidden='true' className={styles.divider.class} />

      <section>
        <div className={styles.label.class}>caller focus · complete replacement</div>
        <A
          {...link}
          style={{ ':focus-visible': { outline: '2px dashed currentColor', outlineOffset: '0px' } }}
        >
          Custom outline
        </A>
      </section>

      <div aria-hidden='true' className={styles.divider.class} />

      <section>
        <div className={styles.label.class}>caller hover animation · hover while tabbing here</div>
        <A
          {...link}
          style={{
            ':hover': { animation: 'sys-anchor-spec-hover 1s ease-in-out infinite alternate' },
          }}
        >
          Caller-owned text glow
        </A>
      </section>

      <div aria-hidden='true' className={styles.divider.class} />

      <section>
        <div className={styles.label.class}>native links · Enter / modifier / middle click</div>
        <A {...link} href='https://example.com' target='_blank'>New tab ↗</A>
        {' · '}
        <A {...link} href='/dist.json' download>Download</A>
        {' · '}
        <A {...link} enabled={false}>Disabled</A>
        {' · '}
        <A href=''>No href</A>
      </section>
      <div id='anchor-focus-target' className={css(styles.label, { marginTop: 16 }).class}>
        Local navigation target
      </div>
    </div>
  );
}
