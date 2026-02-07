import React from 'react';
import { type t, BulletList, Color, css, Is } from './common.ts';

type P = t.HttpOriginProps;

/**
 * Component:
 */
export const OriginSelector: React.FC<P> = (props) => {
  const { debug = false, env = 'localhost' } = props;
  const localhostEnabled = isBrowserLocalhost();
  const items: t.BulletList.Item[] = [
    { id: 'localhost', enabled: localhostEnabled },
    { id: 'production' },
  ];

  React.useEffect(() => {
    if (localhostEnabled) return;
    if (env !== 'localhost') return;
    props.onChange?.({ next: 'production' });
  }, [localhostEnabled, env, props]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      lineHeight: 1.6,
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <BulletList.UI
        theme={theme.name}
        selected={env}
        items={items}
        onSelect={(e) => {
          if (!isEnv(e.id)) return;
          props.onChange?.({ next: e.id });
        }}
      />
    </div>
  );
};

function isEnv(input: string): input is t.HttpOriginEnv {
  return input === 'localhost' || input === 'production';
}
