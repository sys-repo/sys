import { Icon } from '@sys/ui-react-components';
import { MdErrorOutline, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Chevron: { Left: icon(MdChevronLeft), Right: icon(MdChevronRight) },
} as const;
