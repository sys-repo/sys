import React from 'react';
import { type t, DEFAULTS } from './common.ts';
import { Entry } from './ui.tsx';

export function factory(options: t.ContentFactoryOptions = {}) {
  const content: t.StaticContent = {
    id: 'Entry',
    kind: 'StaticContent',
    render(props) {
      return <Entry {...props} theme={DEFAULTS.theme.base} />;
    },
  };
  return content;
}
