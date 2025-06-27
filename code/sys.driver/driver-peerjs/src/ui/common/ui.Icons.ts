import { Icon } from '@sys/ui-react-components';
import { MdClose, MdErrorOutline } from 'react-icons/md';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Close: icon(MdClose),
} as const;
