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

/** Native focus indication: default, root override, and an independent child. */
export function FocusExamples(props: FocusExamplesProps) {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ display: 'grid', color: theme.fg }),
    example: css({ display: 'grid', justifyItems: 'start', gap: '10px' }),
    label: css({ fontSize: 12, opacity: 0.25 }),
    openLabel: css({ display: 'inline-flex', alignItems: 'center', gap: 4 }),
    icon: css({ display: 'grid' }),
  };
  const buttonProps = { ...props, theme: theme.name };
  const child = runLabelFocus('--run-arrival');

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
    </div>
  );
}
