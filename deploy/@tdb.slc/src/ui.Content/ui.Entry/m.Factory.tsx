import React from 'react';
import { type t, DEFAULTS } from './common.ts';
import { Entry } from './ui.tsx';

export function factory() {
  const content: t.StaticContent = {
    id: 'Entry',
    kind: 'StaticContent',
    render: (props) => <Entry {...props} theme={DEFAULTS.theme.base} />,
  };
  return content;
}
