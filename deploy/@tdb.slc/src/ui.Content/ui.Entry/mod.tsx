import React from 'react';
import { type t, DEFAULTS } from '../ui.ts';
import { Entry } from './ui.tsx';

export function factory() {
  const id: t.ContentStage = 'Entry';
  const content: t.Content = {
    id,
    render: (props) => <Entry {...props} theme={DEFAULTS.theme.base} />,
    timestamps: {},
  };
  return content;
}
