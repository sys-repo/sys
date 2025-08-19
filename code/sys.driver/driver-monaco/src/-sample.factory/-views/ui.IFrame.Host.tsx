import React from 'react';
import { type t, Color, Cropmarks, css } from '../common.ts';

import { IFrame as IFrameView } from '@sys/ui-react-components';
import type { IFrameSchema } from '../-schemas/mod.ts';

export type IFrameHostProps = {
  data?: IFrameSchema;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const IFrameHost: React.FC<IFrameHostProps> = (props) => {
  const { data = {} } = props;
  const sandbox = data?.sandbox ?? true;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({ backgroundColor: Color.WHITE, display: 'grid' }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <IFrameView {...data} sandbox={sandbox} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.04} size={{ mode: 'fill', margin: 60 }}>
        {elBody}
      </Cropmarks>
    </div>
  );
};
