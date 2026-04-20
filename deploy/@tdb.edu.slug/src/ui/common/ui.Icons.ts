import { Icon } from '@sys/ui-react-components/icon';
import { MdArrowBack, MdErrorOutline, MdFace } from 'react-icons/md';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Face: icon(MdFace),
  Error: icon(MdErrorOutline),
  Arrow: { Left: icon(MdArrowBack) },
} as const;
