import { Icon } from '@sys/ui-components';
import { MdErrorOutline } from 'react-icons/md';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
} as const;
