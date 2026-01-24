import React, { useEffect, useRef, useState } from 'react';
import {
  type t,
  Color,
  css,
  Signal,
  D,
  Rx,
  Obj,
  Str,
  Is,
  Button,
  KeyValue,
  ObjectView,
} from './common.ts';

export type DriverInfoProps = {
  title?: string;
  controller?: t.SlugPlaybackController;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DriverInfo: React.FC<DriverInfoProps> = (props) => {
  const { debug = false, title = D.name, controller } = props;

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

  add('base-url', controller?.props.baseUrl ?? '-');

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI items={items} theme={theme.name} />

      {debug && (
        <ObjectView name={'controller'} data={controller} style={{ marginTop: 6 }} expand={1} />
      )}
    </div>
  );
};
