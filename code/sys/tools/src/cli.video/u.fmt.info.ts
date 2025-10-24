import { type t, c, Cli } from './common.ts';

export function buildProbeTable(info: t.VideoProbeInfo): string {
  const table = Cli.table([]);

  table.push([c.green('Container'), '']);

  if (info.formatName) table.push(['  format', info.formatName]);
  if (info.formatLongName && info.formatLongName !== info.formatName)
    table.push(['  description', c.gray(info.formatLongName)]);
  if (info.durationSec != null) table.push(['  duration', `${info.durationSec.toFixed(3)} s`]);
  if (info.sizeBytes != null)
    table.push(['  size', `${(info.sizeBytes / 1_000_000).toFixed(2)} MB`]);
  if (info.bitRate != null) table.push(['  bitrate', `${(info.bitRate / 1000).toFixed(1)} kbps`]);

  if (info.video) {
    const v = info.video;
    table.push([c.green('Video'), '']);
    if (v.codec) table.push(['  codec', v.codec]);
    if (v.width && v.height) table.push(['  resolution', `${v.width}×${v.height}`]);
    if (v.fps != null || v.avgFrameRate) {
      const fps = v.fps != null ? `${v.fps} fps` : '';
      const raw = v.avgFrameRate ? c.gray(` (${v.avgFrameRate})`) : '';
      table.push(['  frame rate', `${fps}${raw}`]);
    }
    if (v.bitRate != null) table.push(['  bitrate', `${(v.bitRate / 1000).toFixed(1)} kbps`]);
    if (v.pixelFormat) table.push(['  pixel fmt', v.pixelFormat]);
    if (v.profile) table.push(['  profile', v.profile]);
    if (v.colorSpace || v.colorTransfer || v.colorPrimaries) {
      table.push([
        '  color',
        [v.colorSpace, v.colorTransfer, v.colorPrimaries]
          .filter(Boolean)
          .map((x) => c.gray(String(x)))
          .join(', '),
      ]);
    }
    if (v.fieldOrder) table.push(['  field order', v.fieldOrder]);
  }

  if (info.audio) {
    const a = info.audio;
    table.push([c.green('Audio'), '']);
    if (a.codec) table.push(['  codec', a.codec]);
    if (a.sampleRate != null)
      table.push(['  sample rate', `${(a.sampleRate / 1000).toFixed(1)} kHz`]);
    if (a.channels != null)
      table.push(['  channels', `${a.channels}${a.channelLayout ? ` (${a.channelLayout})` : ''}`]);
    if (a.bitRate != null) table.push(['  bitrate', `${(a.bitRate / 1000).toFixed(1)} kbps`]);
  }

  return table.toString().trim();
}
