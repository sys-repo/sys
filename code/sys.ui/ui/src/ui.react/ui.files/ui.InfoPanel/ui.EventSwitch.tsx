import React from 'react';
import { Switch, type t } from './common.ts';

type P = {
  value?: boolean;
  enabled?: boolean;
  theme?: t.CommonTheme;
  onToggle?: (next: boolean) => void;
};

/** Minimal event-stream switch value renderer. */
export const EventSwitch: React.FC<P> = (props) => {
  const value = Boolean(props.value);
  const enabled = (props.enabled ?? true) && Boolean(props.onToggle);
  return (
    <Switch
      value={value}
      enabled={enabled}
      theme={props.theme}
      height={14}
      width={26}
      tooltip={value ? 'events on' : 'events off'}
      onClick={() => props.onToggle?.(!value)}
    />
  );
};
