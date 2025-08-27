import React from 'react';
import { type t, Color, css } from '../common.ts';
import { HelloSchema } from './schema.ts';

export type HelloProps = t.Infer<typeof HelloSchema>;

/**
 * Component:
 */
export const Hello: React.FC<HelloProps> = (props) => {
  const { debug = false } = props;

  console.log('props', props);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  console.log('theme', theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 15,
      fontSize: 30,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`👋 Hello, ${props.name ?? '<unnamed>'}!`}</div>
    </div>
  );
};
