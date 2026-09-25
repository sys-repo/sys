import { Fmt, Fs, HashFmt, ROOT, stripAnsi, type t, Text } from './common.ts';
import { selectBuild } from '../src/m.deployment/mod.ts';

type BuildStatus = {
  readonly detail: t.Service.Detail;
  readonly formatDetail?: t.HttpServer.Print.FormatDetail;
};

/**
 * Describe the selected local build without making local output a serving prerequisite.
 */
export async function buildStatus(pin: t.DistPin, root = ROOT): Promise<BuildStatus> {
  const selected = await selectBuild(pin, root);
  if (selected.kind !== 'verified') {
    return {
      detail: {
        label: 'shell',
        value: `dist.private/ (unavailable: ${selected.kind})`,
      },
    };
  }

  const dist = selected.evidence.dist;
  const manifestUrl = Fs.Path.toFileUrl(Fs.resolve(selected.dir, 'dist.json'));
  const directoryUrl = new URL('./', manifestUrl);

  function formatValue(maxWidth?: number) {
    const path = Fmt.Path.tty('dist.private/', {
      relative: 'bare',
      highlightBasename: false,
      terminal: maxWidth !== undefined,
      width: maxWidth,
      min: 0,
    });
    const linkedPath = path ? Fmt.hyperlink(path, directoryUrl, { underline: true }) : '';
    const reserve = Text.Width.measure(path) + 1;
    const digestWidth = maxWidth === undefined ? undefined : Math.max(0, maxWidth - reserve);
    const digest = HashFmt.digest(dist.hash.digest, {
      arrow: true,
      url: manifestUrl,
      maxWidth: digestWidth,
    });
    return digest ? `${linkedPath} ${digest}` : linkedPath;
  }

  // Keep terminal presentation separate from renderer-neutral service facts.
  const detail: t.Service.Detail = { label: 'shell', value: stripAnsi(formatValue()) };
  return {
    detail,
    formatDetail(args) {
      if (args.detail.label !== detail.label) return undefined;
      if (args.detail.value !== detail.value) return undefined;
      return formatValue(args.maxWidth);
    },
  };
}
