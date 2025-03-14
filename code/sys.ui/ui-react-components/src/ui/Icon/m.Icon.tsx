import React from 'react';
import type { t } from './common.ts';
import { IconView } from './ui.tsx';

/**
 * Tools for rendering icons.
 */
export const Icon: t.IconLib = {
  renderer: (type) => (props) => <IconView type={type} {...props} />,
};
