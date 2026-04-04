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
    state: css({
      display: 'grid',
      gap: 2,
      justifyItems: 'end',
      fontSize: 11,
      fontFamily: 'sans-serif',
      color: Color.alpha(theme.fg, 0.45),
      minWidth: 90,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI
        theme={theme.name}
        layout={{ kind: 'table' }}
        mono={mono}
        items={[
          { kind: 'title', v: 'Value' },
          {
            k: 'default',
            v: <Value theme={theme.name} url={'https://app.example.com'} reserveStatusSpace={reserveStatusSpace} />,
          },
          {
            k: 'verified: true',
            v: (
              <div className={styles.state.class}>
                <Value
                  theme={theme.name}
                  url={'https://cdn.example.com'}
                  verified={true}
                  reserveStatusSpace={reserveStatusSpace}
                />
              </div>
            ),
          },
          {
            k: 'verified: false',
            v: (
              <div className={styles.state.class}>
                <Value
                  theme={theme.name}
                  url={'https://video.cdn.example.com'}
                  verified={false}
                  reserveStatusSpace={reserveStatusSpace}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
