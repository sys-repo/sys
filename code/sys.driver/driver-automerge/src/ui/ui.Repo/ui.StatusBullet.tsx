import React from 'react';
import { type t, Bullet, Color } from './common.ts';
import { getStatus } from './u.status.ts';

type P = t.RepoStatusBulletProps;

export const StatusBullet: React.FC<P> = (props) => {
  const { repo } = props;
  const status = props.status ?? (repo ? getStatus(repo) : undefined);
  const online = status?.status === 'online';
  const color = online ? Color.GREEN : Color.YELLOW;

  return (
    <Bullet
      style={props.style}
      theme={props.theme}
      selected={true}
      selectedColor={color}
      filled={true}
    />
  );
};
