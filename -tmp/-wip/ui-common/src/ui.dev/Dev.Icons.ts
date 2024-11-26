import { BiCommand } from 'react-icons/bi';
import { HiCommandLine } from 'react-icons/hi2';
import {
  MdCheck,
  MdClose,
  MdContentCopy,
  MdDarkMode,
  MdDoneAll,
  MdInfoOutline,
  MdKeyboard,
  MdKeyboardTab,
  MdLightMode,
  MdLink,
  MdNotStarted,
  MdPlayArrow,
  MdPlayCircle,
  MdPlayCircleOutline,
  MdReplay,
  MdSchedule,
  MdSlowMotionVideo,
  MdToggleOff,
  MdToggleOn,
  MdWarning,
} from 'react-icons/md';
import { TbPrompt } from 'react-icons/tb';
import { VscBook, VscBookmark, VscSymbolClass, VscSymbolVariable } from 'react-icons/vsc';
import { Icon } from '../ui/Icon/mod.ts';

export { Icon };
const icon = Icon.renderer;

/**
 * DevTools icons.
 */
export const DevIcons = {
  NewTab: icon(MdKeyboardTab),
  Link: icon(MdLink),
  Book: icon(VscBook),
  Bookmark: icon(VscBookmark),
  Info: icon(MdInfoOutline),
  Method: icon(VscSymbolVariable),
  ObjectTree: icon(VscSymbolClass),
  Close: icon(MdClose),
  Copy: icon(MdContentCopy),
  Tick: icon(MdCheck),
  Skip: icon(MdToggleOff),
  Play: icon(MdPlayArrow),
  Run: {
    FullCircle: { Outline: icon(MdPlayCircleOutline), Solid: icon(MdPlayCircle) },
    HalfCircle: icon(MdSlowMotionVideo),
    NotStarted: icon(MdNotStarted),
  },
  Wait: icon(MdSchedule),
  CmdPrompt: icon(TbPrompt),
  Command: icon(HiCommandLine),
  CommandKey: icon(BiCommand),
  Keyboard: icon(MdKeyboard),
  Test: {
    Run: icon(MdPlayArrow),
    Rerun: icon(MdReplay),
    Passed: icon(MdDoneAll),
    Failed: icon(MdWarning),
    Skipped: icon(MdToggleOn),
  },
  Theme: { Light: icon(MdLightMode), Dark: icon(MdDarkMode) },
};
