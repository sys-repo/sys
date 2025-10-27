import { type t, Json, Process } from './common.ts';

/**
 * Probe a media file for useful metadata (via ffprobe).
 * - Returns numeric fps (parsed from avg_frame_rate) when available.
 * - All bit rates in bits-per-second (bps).
 */
export async function probeVideo(src: t.StringPath): Promise<t.VideoProbeInfo> {
  const res = await Process.run(
    `ffprobe -v quiet -print_format json -show_format -show_streams "${src}"`,
    { silent: true },
  );

  if (!res.success) {
    const msg = res.text.stderr.trim() || res.text.stdout.trim() || 'ffprobe failed';
    throw new Error(msg);
  }

  const json = Json.safeParse<any>(res.text.stdout).data;
  const format = json?.format ?? {};
  const streams: any[] = Array.isArray(json?.streams) ? json.streams : [];

  const v = streams.find((s) => s?.codec_type === 'video') ?? {};
  const a = streams.find((s) => s?.codec_type === 'audio') ?? {};

  const avg = str(v?.avg_frame_rate);
  const rfr = str(v?.r_frame_rate);
  const fps = parseFps(avg);

  return {
    path: src,

    // Container:
    formatName: str(format?.format_name),
    formatLongName: str(format?.format_long_name),
    durationSec: num(format?.duration),
    sizeBytes: num(format?.size),
    bitRate: num(format?.bit_rate),

    // Video:
    video: hasAny(v)
      ? {
          codec: str(v?.codec_name),
          codecLongName: str(v?.codec_long_name),
          width: num(v?.width),
          height: num(v?.height),
          pixelFormat: str(v?.pix_fmt),
          profile: str(v?.profile),
          level: num(v?.level),
          bitRate: num(v?.bit_rate),
          avgFrameRate: avg || undefined,
          rFrameRate: rfr || undefined,
          fps: fps ?? undefined,
          colorSpace: str(v?.color_space),
          colorTransfer: str(v?.color_transfer),
          colorPrimaries: str(v?.color_primaries),
          fieldOrder: str(v?.field_order),
        }
      : undefined,

    // Audio:
    audio: hasAny(a)
      ? {
          codec: str(a?.codec_name),
          codecLongName: str(a?.codec_long_name),
          channels: num(a?.channels),
          channelLayout: str(a?.channel_layout),
          sampleRate: num(a?.sample_rate),
          bitRate: num(a?.bit_rate),
        }
      : undefined,
  };
}

/**
 * Helpers:
 */
function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim().length > 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function hasAny(obj: any): boolean {
  return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
}
function parseFps(fr: string | undefined): number | undefined {
  if (!fr) return undefined;
  if (fr.includes('/')) {
    const [a, b] = fr.split('/').map((x) => Number(x));
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) {
      return Number((a / b).toFixed(3));
    }
    return undefined;
  }
  const n = Number(fr);
  return Number.isFinite(n) ? Number(n.toFixed(3)) : undefined;
}
