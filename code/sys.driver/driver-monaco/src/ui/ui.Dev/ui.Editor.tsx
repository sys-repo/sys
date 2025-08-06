import React from 'react';

import { type t, Color, css } from './common.ts';
import { Body } from './ui.Editor.Body.tsx';
import { NotReady } from './ui.NotReady.tsx';

type P = t.DevEditorProps;

export const DevEditor: React.FC<P> = (props) => {
  const { debug = false, repo } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
  };

  const elNoRepo = !repo && <NotReady theme={theme.name} label={'No CRDT repository.'} />;
  const elError = elNoRepo;

  return (
    <div className={css(styles.base, props.style).class}>{elError || <Body {...props} />}</div>
  );
};
