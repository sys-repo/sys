import { Cropmarks, LayoutCenterColumn } from '@sys/ui-react-components';
import {} from '@sys/ui-react-components/t';

import React from 'react';
import { type t, Color, css } from '../common.ts';
import { IndexTree } from './ui.Section.Host.tsx';

type O = Record<string, unknown>;

type Data = {
  align?: 'Left' | 'Center' | 'Right';
  column?: O;
};

export type LayoutHostProps = {
  data?: O;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LayoutHost: React.FC<LayoutHostProps> = (props) => {
  const { data = {} } = props;
  const columnData = data?.column ?? {};

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
    center: css({
      backgroundColor: Color.WHITE,
      minWidth: 380,
      // backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  const elCenter = (
    <div className={styles.center.class}>
      <IndexTree outerTheme={'Dark'} theme={'Light'} data={columnData as any} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.12} size={{ mode: 'fill', margin: 60 }}>
        <LayoutCenterColumn center={elCenter} align={data.align as any} />
      </Cropmarks>
    </div>
  );
};
