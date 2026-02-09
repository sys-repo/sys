import React from 'react';
import { BackButton, TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import { type t, Color, css, Signal } from './common.ts';

export type SpecRootProps = {
  debug: t.DebugSignals;
  style?: t.CssValue;
};

/**
 * Component:
 */
export const SpecRoot: React.FC<SpecRootProps> = (props) => {
  const { debug } = props;
  const v = Signal.toObject(debug.props);

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    back: css({ Absolute: [-35, null, null, -35] }),
  };

  return (
    <div className={styles.base.class}>
      <BackButton style={styles.back} theme={theme.name} />
      <TreeHost.UI
        debug={v.debug}
        theme={theme.name}
        onNodeSelect={() => undefined}
      />
    </div>
  );
};
