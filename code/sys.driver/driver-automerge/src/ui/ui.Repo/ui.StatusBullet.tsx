import React from 'react';
import { type t, Bullet, Color } from './common.ts';
import { getStatus } from './u.status.ts';

type P = t.RepoStatusBulletProps;

export const StatusBullet: React.FC<P> = (props) => {
  const { repo } = props;
  const status = repo ? getStatus(repo) : undefined;
  const online = status?.status === 'online';
  let color = Color.YELLOW;
  if (online && !repo?.status.stalled) color = Color.GREEN;

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
