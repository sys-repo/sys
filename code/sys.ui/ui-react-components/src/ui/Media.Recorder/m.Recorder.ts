import { type t } from './common.ts';
import { Files } from './ui.Files.tsx';
import { useRecorder } from './use.Recorder.ts';

export const Recorder: t.MediaRecorderLib = {
  UI: {
    Files,
    useRecorder,
  },
};
