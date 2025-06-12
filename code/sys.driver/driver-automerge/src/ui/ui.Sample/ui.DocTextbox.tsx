import React from 'react';
import { type t, Button, Color, css, TextInput } from './common.ts';

export type DocTextboxProps = {
  label?: string;
  doc?: t.CrdtRef;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DocTextbox: React.FC<DocTextboxProps> = (props) => {
  const { doc, label = 'doc-id:' } = props;
  const value = doc?.id ?? '';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'stretch',
      columnGap: 10,
    }),
    btn: {
      base: css({ display: 'grid', placeItems: 'center' }),
      body: css({ color: Color.BLUE, PaddingX: 20 }),
    },
    label: css({ Absolute: [-20, null, null, 5], opacity: 0.5 }),
    textbox: css({ fontSize: 14 }),
  };

  const elButton = (
    <Button theme={theme.name} style={styles.btn.base}>
      <div className={styles.btn.body.class}>{'New'}</div>
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      <TextInput
        value={value}
        border={{ mode: 'underline', defaultColor: 0 }}
        background={theme.is.dark ? -0.08 : 0}
        theme={theme.name}
        style={styles.textbox}
      />
      {elButton}
    </div>
  );
};
