import type { IconLib } from './t.ts';
import { IconView } from './ui.tsx';

/**
 * Tools for rendering icons.
 */
export const Icon: IconLib = {
  renderer: (type) => (props) => <IconView type={type} {...props} />,
};
