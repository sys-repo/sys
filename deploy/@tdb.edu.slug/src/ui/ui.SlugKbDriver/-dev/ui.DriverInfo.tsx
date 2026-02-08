import React from 'react';
import { type t, Color, css, D, EffectController, KeyValue, Str } from './common.ts';

export type DriverInfoProps = {
  title?: string;
  controller?: t.SlugKbController;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component: Minimal diagnostic panel showing controller state.
 */
export const DriverInfo: React.FC<DriverInfoProps> = (props) => {
  const { title = D.name, controller } = props;

  /**
   * Hooks:
   */
  const state = EffectController.useEffectController(controller);
  const selectedPath = state?.selectedPath;
  const path = selectedPath ? `/${Str.trimLeadingSlashes(selectedPath?.join('/'))}` : '-';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  const mono = true;
  const items: t.KeyValueItem[] = [{ kind: 'title', v: title }];
  const add = (k: string, v: t.ReactNode) => items.push({ k, v, mono });

  add('controller', 'EffectController');
  add('base-url', controller?.props.baseUrl ?? '-');
  add('selected-path', Str.ellipsize(path, [15, 15], ' .. '));

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI items={items} theme={theme.name} />
    </div>
  );
};
