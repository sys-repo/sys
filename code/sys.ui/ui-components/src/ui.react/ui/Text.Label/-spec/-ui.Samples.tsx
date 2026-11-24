import { useState } from 'react';
import { Anchor } from '../../Anchor/mod.ts';
import { BulletList } from '../../BulletList/mod.ts';
import { Button } from '../../Button/mod.ts';
import { TextLabel } from '../mod.ts';
import { Color, css, D, type t } from './common.ts';

type Props = Pick<t.TextLabel.Props, 'value' | 'overflow' | 'debug'> & {
  theme?: t.CommonTheme;
  width: number;
  fontSize: number;
};
const token = '/-sample/long-directory-name/example.bundle.js.map';

/** Browser fixtures use real labels; hosts and interactions stay dev-only. */
export function Samples(props: Props) {
  const theme = Color.theme(props.theme);
  const [activations, setActivations] = useState(0);
  const activate = () => setActivations((count) => count + 1);
  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 16,
      width: props.width,
      maxWidth: '100%',
      fontSize: props.fontSize,
      color: theme.fg,
    }),
    heading: css({ font: '11px sans-serif', opacity: 0.65, marginBottom: 5 }),
    line: css({ outline: `dotted 1px ${Color.alpha(theme.fg, 0.25)}` }),
    prefix: css({ display: 'inline-block', width: 'calc(100% - 2em)' }),
  };
  const label = (value: string, overflow: t.TextLabel.Overflow = D.overflow) => {
    return <TextLabel.UI value={value} overflow={overflow} debug={props.debug} />;
  };
  const rows: readonly { title: string; content: t.ReactNode }[] = [
    { title: '1 · Current value / selected overflow', content: label(props.value, props.overflow) },
    { title: '2 · Current-line fit / inherited baseline', content: <>Ag {label('`Ag`')} Ag</> },
    {
      title: '3 · Fresh-line placement (2em remain)',
      content: (
        <>
          <span className={styles.prefix.class}>Before</span>
          {label('`build --prod` after.')}
        </>
      ),
    },
    { title: '4 · Long code / Chip-owned overflow', content: label(`\`${token}\``) },
    { title: '5 · Adjacent and nested code', content: label('**Ag *`Ag`*** `build` `next` Ag') },
    { title: '6 · Whole-label owner / mixed', content: label(`Run \`${token}\` now.`, 'truncate') },
    { title: '7 · Whole-label owner / code only', content: label(`\`${token}\``, 'truncate') },
    {
      title: '8 · Anchor owner / code only',
      content: (
        <Anchor.Link
          href='#text-label-sample'
          resource='web'
          theme={theme.name}
          truncate
          style={{ maxWidth: '100%' }}
          onClick={(e) => {
            e.preventDefault();
            activate();
          }}
        >
          {label(`\`${token}\``, 'host')}
        </Anchor.Link>
      ),
    },
    {
      title: '9 · Button label slot / 120px',
      content: (
        <Button
          theme={theme.name}
          style={{ width: 120 }}
          label={label(props.value)}
          onClick={activate}
        />
      ),
    },
    {
      title: '10 · Button children slot / 120px',
      content: (
        <Button theme={theme.name} style={{ width: 120 }} onClick={activate}>
          {label(props.value)}
        </Button>
      ),
    },
    {
      title: '11 · BulletList / explicit nodes, not implicit string adoption',
      content: (
        <BulletList.UI
          theme={theme.name}
          columns={2}
          onActivate={activate}
          items={[
            { id: 'build', label: label(props.value) },
            { id: 'inspect', label: label('Inspect **source** `code`') },
            { id: 'disabled', label: label(props.value), enabled: false },
          ]}
        />
      ),
    },
    { title: '12 · Local literal recovery', content: label('**Save** [**help**](/-sample/help)') },
    { title: '13 · Whole-input fallback', content: label('# **Literal heading**') },
  ];

  return (
    <div className={styles.base.class}>
      <div className={styles.heading.class}>Synthetic sample paths. Activations: {activations}</div>
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
