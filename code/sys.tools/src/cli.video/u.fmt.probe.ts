import { type t, c, Cli } from './common.ts';

type HashDepthNum = number;

/**
 * Build a clean, uniformly indented probe table.
 */
export function buildProbeTable(
  info: t.VideoTool.ProbeInfo,
  options: { index?: HashDepthNum; indent?: number } = {},
): string {
  const { indent = 0, index } = options;
  const pad = ' '.repeat(indent);
  const table = Cli.table([]);

  // Header (optional index)
  const header =
    index != null
      ? `${pad}${c.cyan(`#${index}`)}  ${c.green('Container')}`
      : `${pad}${c.green('Container')}`;
  table.push([header, '']);

  if (info.formatName) table.push([`${pad}  format`, info.formatName]);
  if (info.formatLongName && info.formatLongName !== info.formatName)
    table.push([`${pad}  description`, c.gray(info.formatLongName)]);
  if (info.durationSec != null)
    table.push([`${pad}  duration`, `${info.durationSec.toFixed(3)} s`]);
  if (info.sizeBytes != null)
    table.push([`${pad}  size`, `${(info.sizeBytes / 1_000_000).toFixed(2)} MB`]);
  if (info.bitRate != null)
    table.push([`${pad}  bitrate`, `${(info.bitRate / 1000).toFixed(1)} kbps`]);

  if (info.video) {
    const v = info.video;
    table.push(['', '']);
    table.push([`${pad}${c.green('Video')}`, '']);
    if (v.codec) table.push([`${pad}  codec`, v.codec]);
    if (v.width && v.height) table.push([`${pad}  resolution`, `${v.width}×${v.height}`]);
    if (v.fps != null || v.avgFrameRate) {
      const fps = v.fps != null ? `${v.fps} fps` : '';
      const raw = v.avgFrameRate ? c.gray(` (${v.avgFrameRate})`) : '';
      table.push([`${pad}  frame rate`, `${fps}${raw}`]);
    }
    if (v.bitRate != null) table.push([`${pad}  bitrate`, `${(v.bitRate / 1000).toFixed(1)} kbps`]);
    if (v.pixelFormat) table.push([`${pad}  pixel fmt`, v.pixelFormat]);
    if (v.profile) table.push([`${pad}  profile`, v.profile]);
    if (v.colorSpace || v.colorTransfer || v.colorPrimaries) {
      table.push([
        `${pad}  color`,
        [v.colorSpace, v.colorTransfer, v.colorPrimaries]
          .filter(Boolean)
          .map((x) => c.gray(String(x)))
          .join(', '),
      ]);
    }
    if (v.fieldOrder) table.push([`${pad}  field order`, v.fieldOrder]);
  }

  if (info.audio) {
    const a = info.audio;
    table.push(['', '']);
    table.push([`${pad}${c.green('Audio')}`, '']);
    if (a.codec) table.push([`${pad}  codec`, a.codec]);
    if (a.sampleRate != null)
      table.push([`${pad}  sample rate`, `${(a.sampleRate / 1000).toFixed(1)} kHz`]);
    if (a.channels != null)
      table.push([
        `${pad}  channels`,
        `${a.channels}${a.channelLayout ? ` (${a.channelLayout})` : ''}`,
      ]);
    if (a.bitRate != null) table.push([`${pad}  bitrate`, `${(a.bitRate / 1000).toFixed(1)} kbps`]);
  }

  return table.toString();
}
