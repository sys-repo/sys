import React from 'react';
import { type t, css, D } from './common.ts';

type P = t.KeyValueItemProps;

/**
 * Component:
 */
export const Spacer: React.FC<P> = (props) => {
  const { item, size = D.size } = props;
  if (item.kind !== 'spacer') return null;

  /**
   * Height based on size flag:
   * - xs → 4px
   * - sm → 6px
   * - md → 10px
   */
  const height = item.size ?? (size === 'md' ? 10 : size === 'sm' ? 6 : 4);

  /**
   * Render:
   */
  return <div className={css({ height }, props.style).class}></div>;
};
