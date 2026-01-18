import React from 'react';
import { type t, Button, Color, css, Icons } from '../common.ts';

type P = t.TreeHostProps;

export type BackButtonProps = {
  selectedPath?: P['selectedPath'];
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onBack?: (e: { readonly current: t.ObjectPath; readonly next: t.ObjectPath }) => void;
};

/**
 * Component:
 */
export const BackButton: React.FC<BackButtonProps> = (props) => {
  const { selectedPath } = props;
  const hasPath = (selectedPath?.length ?? 0) > 0;

  /**
   * Handlers
   */
  function handleBack() {
    const current = [...(selectedPath ?? [])];
    const next = current.slice(0, -1);
    props.onBack?.({ current, next });
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({}),
  };

  return (
    <Button
      style={css(styles.base, props.style)}
      theme={theme.name}
      enabled={hasPath}
      disabledOpacity={0.12}
      onMouseDown={handleBack}
    >
      <Icons.Arrow.Left />
    </Button>
  );
};
