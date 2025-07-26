import type { MediaRecorderLib } from './t.ts';

import { Files } from './ui.Files.tsx';
import { useRecorder } from './use.Recorder.ts';

export const Recorder: MediaRecorderLib = {
  UI: {
    Files,
    useRecorder,
  },
};
