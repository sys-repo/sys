import { css } from '@sys/ui-css';
import React from 'react';

export type NotFoundProps = {};

export const NotFound: React.FC<NotFoundProps> = (props) => {
  const {} = props;

  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      padding: 10,
    }),
  };

  return (
    <div className={styles.base.class}>
      <div>{`🐷 Component Not Found`}</div>
    </div>
  );
};
