import React from 'react';
import { type t, css } from './common.ts';
import { LabelStyle } from './u.Style.ts';

export type PeerLabelProps = {
  peerId: t.StringId;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PeerLabel: React.FC<PeerLabelProps> = (props) => {
  const peerId = props.peerId;
  const peerParts = peerId.split('-');

  /**
   * Render:
   */
  const styles = {
    base: LabelStyle.base,
    dim: LabelStyle.dim,
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <span className={styles.dim.class}>{`${peerParts.slice(0, -1).join('-')}-`}</span>
      <span>{peerParts.slice(-1)}</span>
    </div>
  );
};
