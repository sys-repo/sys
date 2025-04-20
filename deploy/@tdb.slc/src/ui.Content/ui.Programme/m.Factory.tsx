import React from 'react';
import { type t, Color, css, Sheet, App, Button, DEFAULTS } from '../common.ts';
import { ProgrammeRoot } from './ui.tsx';

/**
 * Content: "Programme"
 */
export function factory() {
  const sheetTheme = DEFAULTS.theme.sheet;
  const content: t.StaticContent = {
    id: 'Programme',
    kind: 'StaticContent',

    render: (props) => <ProgrammeRoot {...props} theme={sheetTheme} />,
  };
  return content;
}
