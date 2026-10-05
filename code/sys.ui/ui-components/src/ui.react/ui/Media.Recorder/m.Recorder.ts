import type { t } from './common.ts';

import { captureInfo } from './u.captureInfo.ts';
import { createMediaRecorder as createRecorder } from './u.createMediaRecorder.ts';
import { Files } from './ui.Files.tsx';
import { useRecorder } from './use.Recorder.ts';

export const Recorder: t.MediaRecorderLib = {
  UI: { Files, useRecorder },
  createRecorder,
  captureInfo,
};
