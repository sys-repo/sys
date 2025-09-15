import React from 'react';
import { type t, Color, css } from '../common.ts';
import { HelloPropsSchema } from './schema.ts';

export type HelloProps = t.Infer<typeof HelloPropsSchema>;

/**
 * Component:
 */
export const Hello: React.FC<HelloProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  console.log('theme', theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontFamily: 'sans-serif',
      padding: 20,
      fontSize: 30,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`👋 Hello, ${props.name ?? 'Unnamed'}!`}</div>
    </div>
  );
};
