import { useState } from 'react';
import { ObjectView, RenderCount, css, type t } from '../common';

import type { T } from './-SPEC';

export type SampleProps = {
  state: T;
  theme?: t.CommonTheme;
  renderPosition?: [number, number];
  style?: t.CssValue;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { renderPosition } = props;

  /**
   * NOTE: ensuring hooks behave as expected.
   */
  const [isOver, setOver] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);
  const data = { state: props.state, isOver };
  const theme = props.theme ?? props.state.theme;
  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      fontSize: 14,
      Padding: [5, 12],
    }),
  };

  return (
    <div {...css(styles.base, props.style)} onMouseEnter={over(true)} onMouseLeave={over(false)}>
      <ObjectView name={'state'} data={data} theme={theme} />
      {renderPosition && <RenderCount absolute={renderPosition} theme={theme} />}
    </div>
  );
};
