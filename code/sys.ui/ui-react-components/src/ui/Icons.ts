import {
  MdArrowBack,
  MdArrowDownward,
  MdErrorOutline,
  MdFace,
  MdPause,
  MdRadioButtonChecked,
  MdStopCircle,
} from 'react-icons/md';
import { VscSymbolClass } from 'react-icons/vsc';
import { Icon } from './Icon/mod.ts';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Face: icon(MdFace),
  Object: icon(VscSymbolClass),
  Error: icon(MdErrorOutline),
  Arrow: { Down: icon(MdArrowDownward), Back: icon(MdArrowBack) },
  Recorder: {
    Recording: icon(MdRadioButtonChecked),
    Paused: icon(MdPause),
    Stopped: icon(MdStopCircle),
  },
} as const;
