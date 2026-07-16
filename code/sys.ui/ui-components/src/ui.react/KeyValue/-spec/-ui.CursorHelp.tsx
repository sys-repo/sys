import React from 'react';
import { Chip, Color, css, type t } from './common.ts';

export type CursorHelpProps = {
  readonly theme?: t.CommonTheme;
  readonly style?: t.CssInput;
};

const steps: readonly { gesture: string; text: string }[] = [
  { gesture: 'Option + Enter', text: 'enters.' },
  { gesture: 'Option + ←/→', text: 'enters key/value lanes.' },
  { gesture: '↑/↓', text: 'moves cursor.' },
  { gesture: 'Option + ↑/↓', text: 'moves by hr-delimited blocks.' },
  { gesture: 'Home/End · Command/Ctrl + ↑/↓', text: 'moves to top/bottom.' },
  { gesture: 'Enter', text: 'enters groups.' },
  { gesture: 'Esc', text: 'exits.' },
];

export const CursorHelp: React.FC<CursorHelpProps> = (props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: Color.alpha(theme.fg, 0.66),
      fontSize: 12,
      lineHeight: 1.45,
      marginTop: 5,
      marginBottom: 8,
      marginLeft: 8,
    }),
    focused: css({ marginTop: 6 }),
    list: css({ margin: '3px 0 0 0', paddingLeft: 18 }),
    listItem: css({ marginTop: 2, paddingLeft: 2 }),
    itemContent: css({
      display: 'grid',
      gridTemplateColumns: 'max-content 1fr',
      columnGap: 8,
      alignItems: 'baseline',
    }),
    gesture: css({ minWidth: 0, justifySelf: 'start', whiteSpace: 'nowrap' }),
  };

  const code = (text: string) => (
    <Chip.UI mono theme={theme.name} size='sm'>
      {text}
    </Chip.UI>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {code('Option-click')} {'a row, or '} {code('Option + Enter')} {'to focus.'}
      <div className={styles.focused.class}>{'Once focused:'}</div>
      <ul className={styles.list.class}>
        {steps.map((step) => (
          <li key={step.gesture} className={styles.listItem.class}>
            <span className={styles.itemContent.class}>
              <span className={styles.gesture.class}>{code(step.gesture)}</span>
              <span>{step.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
