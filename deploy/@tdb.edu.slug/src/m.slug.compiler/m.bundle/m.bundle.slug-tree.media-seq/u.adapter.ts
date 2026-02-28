import { type t, Ffmpeg, Hash, Is } from './common.ts';

type SourceMap = Map<string, string>;
type SlugPathCtx = ReturnType<t.Parser['path']>;
type MediaDurationProbe = (path: string) => Promise<t.Msecs | undefined>;

export function makeAssetResolver(args: {
  fs: t.FsCapability.Instance;
  pathCtx: SlugPathCtx;
  resolvedSources: SourceMap;
}): t.SlugBundleTransform.AssetResolver {
  return async (asset) => {
    try {
      if (!args.pathCtx.ok) return { ok: true, value: undefined };
      const expanded = args.pathCtx.resolve(asset.logicalPath)?.value ?? '';
      if (!expanded) return { ok: true, value: undefined };
      const resolvedPath = args.fs.resolve(expanded, { expandTilde: true });
      const exists = await args.fs.exists(resolvedPath);
      if (!exists) return { ok: true, value: undefined };

      const bytes = (await args.fs.read(resolvedPath)).data;
      const hash = Hash.sha256(bytes);
      const stat = await args.fs.stat(resolvedPath);
      const stats = Is.number(stat?.size) ? { bytes: stat.size } : undefined;
      args.resolvedSources.set(sourceKey(asset.kind, asset.logicalPath), resolvedPath);

      return {
        ok: true,
        value: {
          kind: asset.kind,
          logicalPath: asset.logicalPath,
          hash,
          bytes,
          stats,
          source: { resolvedPath },
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { ok: false, error: err };
    }
  };
}

export function makeMediaDurationProbe(): MediaDurationProbe {
  return async (path) => {
    const result = await Ffmpeg.duration(path);
    return result.ok ? result.msecs : undefined;
  };
}

export function makeDurationProbe(
  probeMediaDuration: MediaDurationProbe,
): t.SlugBundleTransform.DurationProbe {
  return async (args) => {
    if (args.asset.kind !== 'video') return undefined;
    const resolvedPath = resolveSourcePathFromProbe(args.asset);
    if (!resolvedPath) return undefined;
    return await probeMediaDuration(resolvedPath);
  };
}

export function sourceKey(kind: string, logicalPath: string): string {
  return `${kind}|${logicalPath}`;
}

export function resolveSourcePathFromProbe(asset: { source?: unknown }): string | undefined {
  if (!Is.record(asset.source)) return undefined;
  const value = (asset.source as Record<string, unknown>)['resolvedPath'];
  return Is.string(value) ? value : undefined;
}
