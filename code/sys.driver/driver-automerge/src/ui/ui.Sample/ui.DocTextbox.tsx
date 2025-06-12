import React from 'react';
import { type t, Button, Color, css, TextInput } from './common.ts';

export type DocTextboxProps = {
  label?: string;
  docId?: t.StringId;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onCreateNew?: () => void;
  onTextChange?: t.TextInputChangeHandler;
};

/**
 * Component:
 */
export const DocTextbox: React.FC<DocTextboxProps> = (props) => {
  const { label = 'document-id:', docId } = props;

  /**
   * Hooks:
   */
  const [isBtnOver, setBtnOver] = React.useState(false);

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
      columnGap: 5,
    }),
    label: css({ Absolute: [-20, null, null, 5], opacity: 0.5 }),
    textbox: css({ fontSize: 14 }),
    btn: {
      base: css({ display: 'grid' }),
      body: css({
        borderRadius: 4,
        backgroundColor: isBtnOver ? Color.BLUE : undefined,
        color: isBtnOver ? Color.WHITE : Color.BLUE,
        PaddingX: 20,
        margin: 1,
        display: 'grid',
        placeItems: 'center',
      }),
    },
  };

  const elButton = (
    <Button
      theme={theme.name}
      style={styles.btn.base}
      onClick={props.onCreateNew}
      onMouse={(e) => setBtnOver(e.isOver)}
    >
      <div className={styles.btn.body.class}>{'New'}</div>
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      <TextInput
        value={docId}
        border={{ mode: 'underline', defaultColor: 0 }}
        background={theme.is.dark ? -0.08 : 0}
        theme={theme.name}
        style={styles.textbox}
        onChange={props.onTextChange}
      />
      {elButton}
    </div>
  );
};
