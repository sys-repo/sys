import type { t } from './common.ts';
import { createMediaRecorder as createRecorder } from './u.createMediaRecorder.ts';
import { Files } from './ui.Files.tsx';
import { useRecorder } from './use.Recorder.ts';

export const Recorder: t.MediaRecorderLib = {
  createRecorder,
  UI: { Files, useRecorder },
};
