import React from 'react';
import { type t, Color, css, KeyValue } from '../common.ts';
import { Value } from '../ui.Value.tsx';

export type SampleValueProps = {
  mono?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SampleValue: React.FC<SampleValueProps> = (props) => {
  const { mono = true } = props;
  const theme = Color.theme(props.theme);
  const reserveStatusSpace = true;
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI
        theme={theme.name}
        layout={{ kind: 'table' }}
        mono={mono}
        items={[
          {
            k: 'default',
            v: (
              <Value
                theme={theme.name}
                url={'https://app.example.com'}
                reserveStatusSpace={reserveStatusSpace}
                status={'idle'}
              />
            ),
          },
          {
            k: 'status: ok',
            v: (
              <Value
                theme={theme.name}
                url={'https://cdn.example.com'}
                status={'ok'}
                reserveStatusSpace={reserveStatusSpace}
              />
            ),
          },
          {
            k: 'status: error',
            v: (
              <Value
                theme={theme.name}
                url={'https://video.cdn.example.com'}
                status={'error'}
                reserveStatusSpace={reserveStatusSpace}
              />
            ),
          },
          {
            k: 'status: running',
            v: (
              <Value
                theme={theme.name}
                url={'https://stream.example.com'}
                status={'running'}
                reserveStatusSpace={reserveStatusSpace}
              />
            ),
          },
        ]}
      />
    </div>
  );
};
