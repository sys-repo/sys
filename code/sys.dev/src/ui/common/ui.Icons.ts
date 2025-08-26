import { Icon } from '@sys/ui-react-components';

import {
  MdArrowBack,
  MdArrowDownward,
  MdArrowForward,
  MdArrowUpward,
  MdChevronLeft,
  MdChevronRight,
  MdEmojiPeople,
  MdErrorOutline,
  MdLock,
  MdSettingsInputAntenna,
} from 'react-icons/md';
import { TbNetwork, TbNetworkOff } from 'react-icons/tb';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Person: icon(MdEmojiPeople),
  Padlock: icon(MdLock),

  Error: icon(MdErrorOutline),
  Chevron: { Left: icon(MdChevronLeft), Right: icon(MdChevronRight) },
  Arrow: {
    Left: icon(MdArrowBack),
    Right: icon(MdArrowForward),
    Up: icon(MdArrowUpward),
    Down: icon(MdArrowDownward),
  },
  Network: {
    On: icon(TbNetwork),
    Off: icon(TbNetworkOff),
    Antenna: icon(MdSettingsInputAntenna),
  },
} as const;
