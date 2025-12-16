import type { t } from './common.ts';

/**
 * The `@sys/tools/video` type namespace.
 */
export namespace VideoTool {
  export type Id = 'video';
  export type Name = 'system/video:tools';

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Command names */
  export type Command = Conversion | 'probe-file';

  /** Supported video conversion directions. */
  export type Conversion = 'webm-to-mp4' | 'mp4-to-webm';

  /**
   * Convert: from .webm → .mp4
   */
  export type WebmToMp4 = (args: {
    readonly src: string;
    readonly out?: string; //       default: <src>.mp4
    readonly crf?: number; //       default: 18
    readonly aacKbps?: number; //   default: 160
  }) => Promise<string>;

  /**
   * Convert: from .mp4 → .webm
   */
  export type Mp4ToWebm = (args: {
    readonly src: string;
    readonly out?: string; //       default: <src>.webm
    readonly crf?: number; //       default: 32  (size-first: raise; quality-first: lower)
    readonly opusKbps?: number; //  default: 96
  }) => Promise<string>;

  /**
   * Video probe meta-data information.
   */
  export type ProbeInfo = {
    readonly path: string;

    // Container/format
    readonly formatName?: string;
    readonly formatLongName?: string;
    readonly durationSec?: number;
    readonly sizeBytes?: number;
    readonly bitRate?: number; // container/global bps

    // Video stream (v:0)
    readonly video?: {
      readonly codec?: string;
      readonly codecLongName?: string;
      readonly width?: number;
      readonly height?: number;
      readonly pixelFormat?: string;
      readonly profile?: string;
      readonly level?: number;
      readonly bitRate?: number; // bps
      readonly avgFrameRate?: string; // e.g. "30000/1001"
      readonly rFrameRate?: string;
      readonly fps?: number; // parsed numeric fps
      readonly colorSpace?: string;
      readonly colorTransfer?: string;
      readonly colorPrimaries?: string;
      readonly fieldOrder?: string;
    };

    // Audio stream (a:0)
    readonly audio?: {
      readonly codec?: string;
      readonly codecLongName?: string;
      readonly channels?: number;
      readonly channelLayout?: string;
      readonly sampleRate?: number; // Hz
      readonly bitRate?: number; // bps
    };
  };
}
