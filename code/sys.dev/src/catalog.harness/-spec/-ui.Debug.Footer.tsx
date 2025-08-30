import React from 'react';
import type { DebugSignals } from './-SPEC.Debug.tsx';
import { type t, Color, Crdt, css, D } from './common.ts';

export type DebugFooterProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DebugFooter: React.FC<DebugFooterProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  const stateKind = p.stateKind.value;
  if (stateKind !== 'crdt') return null;

  const elDocid = (
    <Crdt.UI.DocumentId.View
      theme={'Light'}
      buttonStyle={{ margin: 4 }}
      controller={{
        repo: debug.repo,
        signals: { doc: p.stateCrdt },
        initial: {},
        localstorage: D.STORAGE_KEY.DEV.CRDT,
      }}
      style={{ marginLeft: 3 }}
    />
  );

  const elRepo = (
    <Crdt.UI.Repo.SyncEnabledSwitch
      repo={debug.repo}
      localstorage={D.STORAGE_KEY.DEV.CRDT}
      style={{
        Padding: [8, 10],
        borderTop: `solid 1px ${theme.alpha(0.1).fg}`,
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elDocid}
      {elRepo}
    </div>
  );
};
