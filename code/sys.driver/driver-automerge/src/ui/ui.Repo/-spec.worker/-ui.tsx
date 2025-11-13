import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Is, KeyValue, Obj, Rx, Signal, Str } from '../common.ts';

export type SampleProps = {
  repo?: t.Crdt.Repo;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Sample: React.FC<SampleProps> = (props) => {
  const { debug = false, repo } = props;

  console.log('repo', repo);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View
        theme={theme.name}
        items={[
          { kind: 'title', v: [D.displayName, 'Worker-Proxy'] },
          { k: 'message', v: '👋 hello, world!' },
        ]}
      />
    </div>
  );
};
