import { MdNorthEast } from 'react-icons/md';
import { Icon } from '../../Icon/mod.ts';
import { Color, css, Dev, type t } from './common.ts';
import { Button } from '../mod.ts';
import { RunLabel, runLabelFocus } from './-ui.RunLabel.tsx';

export type FocusExamplesProps = Pick<
  t.Button.Props,
  'theme' | 'debug' | 'enabled' | 'active' | 'opacity' | 'onClick' | 'onMouse'
>;

const OpenArrow = Icon.renderer(MdNorthEast);

/** Native focus indication on bare, customized, and compact buttons. */
export function FocusExamples(props: FocusExamplesProps) {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ display: 'grid', color: theme.fg }),
    example: css({ display: 'grid', justifyItems: 'start', gap: '10px' }),
    label: css({ fontSize: 12, opacity: 0.25 }),
    openLabel: css({ display: 'inline-flex', alignItems: 'center', gap: 4 }),
    icon: css({ display: 'grid' }),
    prose: css({ fontSize: 12, lineHeight: 1.5, maxWidth: '32ch' }),
    stack: css({
      display: 'grid',
      justifyItems: 'end',
      rowGap: 6,
      paddingInlineEnd: '6px',
      lineHeight: '18px',
    }),
  };
  const buttonProps = { ...props, theme: theme.name };
  const child = runLabelFocus('--run-arrival', theme.name);

  return (
    <div className={styles.base.class}>
      <section className={styles.example.class}>
        <div className={styles.label.class}>default · bare text</div>
        <Button {...buttonProps}>👋 Hello Button</Button>
      </section>

      <Dev.Divider theme={theme.name} />

      <section className={styles.example.class}>
        <div className={styles.label.class}>default · rounded / icon</div>
        <Button {...buttonProps} padding={[6, 10]} style={{ borderRadius: 6 }}>
          <div className={styles.openLabel.class}>
            Open
            <div aria-hidden='true' className={styles.icon.class}>
              <OpenArrow size={14} />
            </div>
          </div>
        </Button>
      </section>

      <Dev.Divider theme={theme.name} />

      <section className={styles.example.class}>
        <div className={styles.label.class}>custom root · complete focus block</div>
        <Button
          {...buttonProps}
          padding={[6, 10]}
          style={{
            borderRadius: 6,
            ':focus-visible': { outline: '2px dashed currentColor', outlineOffset: '3px' },
          }}
        >
          Custom outline
        </Button>
      </section>

      <Dev.Divider theme={theme.name} />

      <section className={styles.example.class}>
        <div className={styles.label.class}>child-owned · css inheritance through a wrapper</div>
        <Button
          {...buttonProps}
          block
          style={{
            '--run-focus': 0,
            ':focus-visible': { outline: 'none', '--run-focus': 1 },
          }}
        >
          <div>
            <RunLabel indicatorOpacity='var(--run-focus, 0)' />
          </div>
        </Button>
      </section>

      <Dev.Divider theme={theme.name} />

      <section className={styles.example.class}>
        <div className={styles.label.class}>shared arrival · child-owned through a wrapper</div>
        <Button
          {...buttonProps}
          block
          style={{
            ...child.activation,
            ':focus-visible': { ...child.activation[':focus-visible'], outline: 'none' },
          }}
        >
          <div>
            <RunLabel indicatorClass={child.class} />
          </div>
        </Button>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='Compact text actions' className={styles.stack.class}>
        <div className={styles.label.class}>compact · blue at rest</div>
        <Button {...buttonProps} tone='accent'>First action</Button>
        <Button {...buttonProps} tone='accent'>Second action</Button>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='Inline text action' className={styles.example.class}>
        <div className={styles.label.class}>inline · 12px text</div>
        <div className={styles.prose.class}>
          You can <Button {...buttonProps} tone='accent'>edit this note</Button>{' '}
          before sharing it with the rest of your team.
        </div>
      </section>

      <Dev.Divider theme={theme.name} />

      <section aria-label='Focus fallback' className={styles.example.class}>
        <div className={styles.label.class}>focus fallback</div>
        <Button
          {...buttonProps}
          tone='accent'
          style={{ overflow: 'hidden', lineHeight: '1', borderRadius: 0 }}
        >
          Clipped content
        </Button>
        <Button {...buttonProps} tone='accent' style={{ position: 'static' }}>
          Static position
        </Button>
      </section>
    </div>
  );
}
